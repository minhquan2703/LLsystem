import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    GoogleGenerativeAI,
    Part,
    ResponseSchema,
} from '@google/generative-ai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MILLISECONDS = 1500;

export interface GenerateStructuredOptions<T> {
    model?: string;
    schema: ResponseSchema;
    parts: Part[];
    temperature?: number;
    inlineAudioMimeFallbacks?: string[];
    validate?: (parsed: T) => boolean;
}

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly client: GoogleGenerativeAI | null;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    }

    async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
        if (!this.client) {
            throw new Error('Thiếu GEMINI_API_KEY trong .env');
        }

        const modelName = options.model ?? 'gemini-3.1-flash';
        const model = this.client.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: options.schema,
                temperature: options.temperature ?? 0.2,
            },
        });

        const mimeTypes = this.resolveMimeTypes(options);
        let lastError: unknown;

        for (const mimeType of mimeTypes) {
            const parts = mimeType ? this.applyInlineAudioMimeType(options.parts, mimeType) : options.parts;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const result = await model.generateContent(parts);
                    const parsed = JSON.parse(result.response.text()) as T;

                    if (options.validate && !options.validate(parsed)) {
                        throw new Error('Gemini trả về JSON không hợp lệ');
                    }

                    return parsed;
                } catch (error) {
                    lastError = error;
                    const message = (error as Error).message;
                    this.logger.warn(
                        `generateStructured thất bại (mimeType=${mimeType ?? 'n/a'}, attempt=${attempt}/${MAX_RETRIES}): ${message}`,
                    );

                    if (attempt < MAX_RETRIES && this.isRetryableError(error)) {
                        await this.sleep(RETRY_DELAY_MILLISECONDS * attempt);
                        continue;
                    }

                    break;
                }
            }
        }

        throw lastError instanceof Error ? lastError : new Error('Gemini generateStructured thất bại');
    }

    private resolveMimeTypes(options: GenerateStructuredOptions<unknown>): Array<string | null> {
        if (!options.inlineAudioMimeFallbacks?.length) {
            return [null];
        }

        return [...new Set(options.inlineAudioMimeFallbacks.map((mimeType) => mimeType.split(';')[0]))];
    }

    private applyInlineAudioMimeType(parts: Part[], mimeType: string): Part[] {
        return parts.map((part) => {
            if (!('inlineData' in part) || !part.inlineData) {
                return part;
            }

            return {
                inlineData: {
                    ...part.inlineData,
                    mimeType,
                },
            };
        });
    }

    private isRetryableError(error: unknown): boolean {
        const message = (error as Error)?.message?.toLowerCase() ?? '';
        return (
            message.includes('429')
            || message.includes('503')
            || message.includes('resource exhausted')
            || message.includes('overloaded')
            || message.includes('timeout')
            || message.includes('fetch failed')
        );
    }

    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
}
