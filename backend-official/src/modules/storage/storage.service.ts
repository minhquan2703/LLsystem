import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppErrorCode } from '@/common/errors.enum';

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
};

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly supabase: SupabaseClient | null;

    constructor(private readonly configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        this.supabase = supabaseUrl && serviceRoleKey
            ? createClient(supabaseUrl, serviceRoleKey)
            : null;
    }

    async uploadSpeakingAudio(params: {
        userId: string;
        attemptId: number;
        buffer: Buffer;
        mimeType: string;
    }): Promise<string> {
        if (!this.supabase) {
            this.logger.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env');
            throw new BadRequestException(AppErrorCode.SPEAKING_STORAGE_FAILED);
        }

        const bucket = this.configService.get<string>('SUPABASE_SPEAKING_BUCKET') ?? 'speaking-audio';
        const normalizedMimeType = params.mimeType.split(';')[0];
        const extension = MIME_TYPE_TO_EXTENSION[normalizedMimeType] ?? 'webm';
        const objectPath = `${params.userId}/${params.attemptId}.${extension}`;

        const { error } = await this.supabase.storage.from(bucket).upload(objectPath, params.buffer, {
            contentType: normalizedMimeType,
            upsert: false,
        });

        if (error) {
            this.logger.error(`Upload speaking audio thất bại: ${error.message}`);
            throw new BadRequestException(AppErrorCode.SPEAKING_STORAGE_FAILED);
        }

        const { data } = this.supabase.storage.from(bucket).getPublicUrl(objectPath);
        return data.publicUrl;
    }

    //xóa file audio theo public URL — best-effort, không chặn việc xóa record nếu thất bại
    async deleteSpeakingAudio(audioUrl: string | null): Promise<void> {
        if (!this.supabase || !audioUrl) {
            return;
        }

        const bucket = this.configService.get<string>('SUPABASE_SPEAKING_BUCKET') ?? 'speaking-audio';
        //object path là phần sau "/public/{bucket}/" trong public URL
        const marker = `/public/${bucket}/`;
        const markerIndex = audioUrl.indexOf(marker);
        if (markerIndex === -1) {
            return;
        }
        const objectPath = decodeURIComponent(audioUrl.slice(markerIndex + marker.length));

        const { error } = await this.supabase.storage.from(bucket).remove([objectPath]);
        if (error) {
            this.logger.warn(`Xóa speaking audio thất bại (bỏ qua): ${error.message}`);
        }
    }
}
