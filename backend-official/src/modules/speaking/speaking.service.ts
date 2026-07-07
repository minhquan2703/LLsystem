import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchemaType, ResponseSchema } from '@google/generative-ai';
import { AppErrorCode } from '@/common/errors.enum';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const detectLanguage = require('franc') as (text: string) => string;
import { GeminiService } from '@/modules/gemini/gemini.service';
import { StorageService } from '@/modules/storage/storage.service';
import { SpeakingQuestion } from '@/modules/speaking/entities/speaking-question.entity';
import { SpeakingAttempt, SpeakingFeedback, SpeakingMetrics, SpeakingProsody } from '@/modules/speaking/entities/speaking-attempt.entity';
import { SubmitSpeakingAttemptDto } from '@/modules/speaking/dto/submit-speaking-attempt.dto';

//base64 ~14M ký tự ≈ 10MB audio — quá đủ cho 2 phút ghi âm
const MAX_AUDIO_BASE64_LENGTH = 14_000_000;
//tỉ lệ tín hiệu giọng nói tối thiểu — dưới ngưỡng này thì audio là im lặng hoặc nhiễu
const MIN_SPEECH_RATIO = 0.05;
//số từ tối thiểu trong transcript để chạy language detection (ngắn hơn thì franc thiếu trigram)
const MIN_WORDS_FOR_LANG_CHECK = 10;
//franc hay nhầm English ngắn/informal thành các ngôn ngữ Germanic gần tiếng Anh — cho phép các code này
const ALLOWED_LANGUAGE_CODES = new Set(['eng', 'und', 'sco', 'nob', 'nno', 'dan', 'swe', 'deu', 'nld', 'afr', 'fry']);

const FILLER_WORDS = ['um', 'uh', 'er', 'erm', 'hmm', 'ah'];

interface GeminiGradingResult {
    audioContainsSpeech: boolean;
    transcript: string;
    bandFluency: number;
    bandLexical: number;
    bandGrammar: number;
    bandPronunciation: number;
    corrections: Array<{ quote: string; issue: string; suggestion: string }>;
    vocabularySuggestions: Array<{ original: string; better: string }>;
    pronunciationNotes: string[];
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
}

const gradingResponseSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        audioContainsSpeech: { type: SchemaType.BOOLEAN },
        transcript: { type: SchemaType.STRING },
        bandFluency: { type: SchemaType.NUMBER },
        bandLexical: { type: SchemaType.NUMBER },
        bandGrammar: { type: SchemaType.NUMBER },
        bandPronunciation: { type: SchemaType.NUMBER },
        corrections: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    quote: { type: SchemaType.STRING },
                    issue: { type: SchemaType.STRING },
                    suggestion: { type: SchemaType.STRING },
                },
                required: ['quote', 'issue', 'suggestion'],
            },
        },
        vocabularySuggestions: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    original: { type: SchemaType.STRING },
                    better: { type: SchemaType.STRING },
                },
                required: ['original', 'better'],
            },
        },
        pronunciationNotes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        modelAnswer: { type: SchemaType.STRING },
    },
    required: [
        'audioContainsSpeech',
        'transcript',
        'bandFluency',
        'bandLexical',
        'bandGrammar',
        'bandPronunciation',
        'corrections',
        'vocabularySuggestions',
        'pronunciationNotes',
        'strengths',
        'improvements',
        'modelAnswer',
    ],
};

@Injectable()
export class SpeakingService {
    private readonly logger = new Logger(SpeakingService.name);

    constructor(
        @InjectRepository(SpeakingQuestion)
        private readonly questionRepo: Repository<SpeakingQuestion>,
        @InjectRepository(SpeakingAttempt)
        private readonly attemptRepo: Repository<SpeakingAttempt>,
        private readonly configService: ConfigService,
        private readonly geminiService: GeminiService,
        private readonly storageService: StorageService,
    ) {}

    async getQuestions(part?: number) {
        const where = part ? { part } : {};
        return this.questionRepo.find({
            where,
            order: { part: 'ASC', orderIndex: 'ASC', id: 'ASC' },
        });
    }

    async getHistory(userId: string) {
        return this.attemptRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 30,
        });
    }

    getProgress = async (userId: string, weeks: number) => {
        //mốc bắt đầu = đầu ngày hôm nay lùi về N tuần
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - weeks * 7);

        const attempts = await this.attemptRepo.find({
            where: { userId, createdAt: MoreThanOrEqual(since) },
            order: { createdAt: 'ASC' },
            loadEagerRelations: false,
            select: {
                bandFluency: true,
                bandLexical: true,
                bandGrammar: true,
                bandPronunciation: true,
                bandOverall: true,
                createdAt: true,
            },
        });

        //gom các lần làm theo tuần, khóa là mốc thứ hai đầu tuần
        const weekGroups = new Map<
            string,
            { sumOverall: number; sumFluency: number; sumLexical: number; sumGrammar: number; sumPronunciation: number; count: number }
        >();
        for (const attempt of attempts) {
            const weekStart = this.getWeekStart(attempt.createdAt);
            const group = weekGroups.get(weekStart) ?? {
                sumOverall: 0,
                sumFluency: 0,
                sumLexical: 0,
                sumGrammar: 0,
                sumPronunciation: 0,
                count: 0,
            };
            group.sumOverall += attempt.bandOverall;
            group.sumFluency += attempt.bandFluency;
            group.sumLexical += attempt.bandLexical;
            group.sumGrammar += attempt.bandGrammar;
            group.sumPronunciation += attempt.bandPronunciation;
            group.count += 1;
            weekGroups.set(weekStart, group);
        }

        //tính band trung bình mỗi tuần, sắp xếp theo thời gian tăng dần
        return [...weekGroups.entries()]
            .map(([weekStart, group]) => ({
                weekStart,
                avgOverall: this.roundOne(group.sumOverall / group.count),
                avgFluency: this.roundOne(group.sumFluency / group.count),
                avgLexical: this.roundOne(group.sumLexical / group.count),
                avgGrammar: this.roundOne(group.sumGrammar / group.count),
                avgPronunciation: this.roundOne(group.sumPronunciation / group.count),
                attemptCount: group.count,
            }))
            .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    };

    private getWeekStart = (date: Date): string => {
        const localDate = new Date(date);
        localDate.setHours(0, 0, 0, 0);
        //getDay: 0=chủ nhật, 1=thứ hai; đưa lùi về thứ hai đầu tuần
        const dayOfWeek = localDate.getDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        localDate.setDate(localDate.getDate() - daysSinceMonday);
        return localDate.toISOString().slice(0, 10);
    };

    private roundOne = (value: number): number => {
        return Math.round(value * 10) / 10;
    };

    getAttemptById = async (userId: string, attemptId: number) => {
        const attempt = await this.attemptRepo.findOne({ where: { id: attemptId, userId } });
        if (!attempt) {
            throw new BadRequestException(AppErrorCode.SPEAKING_ATTEMPT_NOT_FOUND);
        }
        return attempt;
    };

    async deleteAttempt(userId: string, attemptId: number) {
        const attempt = await this.attemptRepo.findOne({ where: { id: attemptId, userId } });
        if (!attempt) {
            throw new BadRequestException(AppErrorCode.SPEAKING_ATTEMPT_NOT_FOUND);
        }
        //xóa file audio trước (best-effort), rồi xóa record
        await this.storageService.deleteSpeakingAudio(attempt.audioUrl);
        await this.attemptRepo.delete({ id: attemptId, userId });
        return { id: attemptId };
    }

    async submitAttempt(userId: string, dto: SubmitSpeakingAttemptDto) {
        if (dto.audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
            throw new BadRequestException(AppErrorCode.SPEAKING_AUDIO_TOO_LARGE);
        }
        if (typeof dto.speechRatio === 'number' && dto.speechRatio < MIN_SPEECH_RATIO) {
            throw new BadRequestException(AppErrorCode.SPEAKING_AUDIO_SILENT);
        }

        const question = await this.questionRepo.findOne({ where: { id: dto.questionId } });
        if (!question) {
            throw new BadRequestException(AppErrorCode.SPEAKING_QUESTION_NOT_FOUND);
        }

        const normalizedMimeType = dto.mimeType.split(';')[0];
        const audioBuffer = Buffer.from(dto.audioBase64, 'base64');

        const grading = await this.gradeWithGemini(question, dto, normalizedMimeType);
        if (!grading.audioContainsSpeech) {
            throw new BadRequestException(AppErrorCode.SPEAKING_AUDIO_SILENT);
        }
        //kiểm tra ngôn ngữ bằng franc — chỉ khi transcript đủ dài để trigram hoạt động tin cậy
        const transcriptWords = grading.transcript.split(/\s+/).filter((word) => word.length > 0);
        if (transcriptWords.length >= MIN_WORDS_FOR_LANG_CHECK) {
            const detectedLang = detectLanguage(grading.transcript);
            if (!ALLOWED_LANGUAGE_CODES.has(detectedLang)) {
                throw new BadRequestException(AppErrorCode.SPEAKING_NOT_ENGLISH);
            }
        }
        const metrics = this.computeMetrics(grading.transcript, dto);

        const feedback: SpeakingFeedback = {
            corrections: grading.corrections,
            vocabularySuggestions: grading.vocabularySuggestions,
            pronunciationNotes: grading.pronunciationNotes,
            strengths: grading.strengths,
            improvements: grading.improvements,
            modelAnswer: grading.modelAnswer,
        };

        const bandFluency = this.clampBand(grading.bandFluency);
        const bandLexical = this.clampBand(grading.bandLexical);
        const bandGrammar = this.clampBand(grading.bandGrammar);
        const bandPronunciation = this.clampBand(grading.bandPronunciation);
        //overall = trung bình 4 tiêu chí, làm tròn xuống bội 0.5 như IELTS thật
        const bandOverall =
            Math.floor(((bandFluency + bandLexical + bandGrammar + bandPronunciation) / 4) * 2) / 2;

        const attempt = this.attemptRepo.create({
            userId,
            questionId: question.id,
            durationSeconds: dto.durationSeconds,
            transcript: grading.transcript,
            bandFluency,
            bandLexical,
            bandGrammar,
            bandPronunciation,
            bandOverall,
            feedback,
            metrics,
            audioUrl: null,
        });
        const saved = await this.attemptRepo.save(attempt);

        const audioUrl = await this.storageService.uploadSpeakingAudio({
            userId,
            attemptId: saved.id,
            buffer: audioBuffer,
            mimeType: normalizedMimeType,
        });
        saved.audioUrl = audioUrl;
        await this.attemptRepo.save(saved);

        //fire-and-forget: không await để không block response trả về user
        this.callAndUpdateProsody(saved.id, audioUrl, grading.transcript).catch(() => {});

        return this.attemptRepo.findOne({ where: { id: saved.id } });
    }

    private async gradeWithGemini(
        question: SpeakingQuestion,
        dto: SubmitSpeakingAttemptDto,
        normalizedMimeType: string,
    ): Promise<GeminiGradingResult> {
        const modelName = this.configService.get<string>('GEMINI_SPEAKING_MODEL') ?? 'gemini-3.1-flash';
        const prompt = this.buildGradingPrompt(question, dto.durationSeconds);

        try {
            return await this.geminiService.generateStructured<GeminiGradingResult>({
                model: modelName,
                schema: gradingResponseSchema,
                parts: [
                    { inlineData: { mimeType: normalizedMimeType, data: dto.audioBase64 } },
                    { text: prompt },
                ],
                inlineAudioMimeFallbacks: [normalizedMimeType, 'audio/ogg'],
                temperature: 0.2,
                validate: (parsed) => typeof parsed.audioContainsSpeech === 'boolean' && typeof parsed.bandFluency === 'number',
            });
        } catch (error) {
            this.logger.error(`Gemini grading failed: ${(error as Error)?.message}`);
            throw new BadRequestException(AppErrorCode.SPEAKING_GRADING_FAILED);
        }
    }

    private buildGradingPrompt(question: SpeakingQuestion, durationSeconds: number): string {
        const cueCard = question.cueCardPoints?.length
            ? `\nCue card points the candidate should cover:\n${question.cueCardPoints.map((p) => `- ${p}`).join('\n')}`
            : '';

        return `You are a certified IELTS Speaking examiner with 10+ years of experience. Listen to the candidate's recorded answer and grade it strictly against the official IELTS Speaking band descriptors.

Context:
- IELTS Speaking Part ${question.part}
- Question: "${question.questionText}"${cueCard}
- Recording length: ${Math.round(durationSeconds)} seconds

Tasks:
1. audioContainsSpeech: set to true if the audio contains a human voice; set to false if the audio is silent or contains only background noise.
2. transcript: transcribe the audio VERBATIM, including filler sounds (um, uh, er), repetitions and false starts. Do not clean it up. If audioContainsSpeech is false, set this to an empty string.
3. Grade each criterion 0-9 (half bands like 5.5 and 6.5 are allowed). If audioContainsSpeech is false, set all bands to 0:
   - bandFluency (Fluency & Coherence): speech rate, pausing/hesitation, self-correction, discourse markers, topic development
   - bandLexical (Lexical Resource): range, precision, idiomatic language, paraphrase ability, collocation errors
   - bandGrammar (Grammatical Range & Accuracy): variety of structures, complex sentences, error density and how much errors impede communication
   - bandPronunciation: individual sounds, word stress, sentence stress, intonation, intelligibility — judge from the actual audio
4. corrections: up to 6 concrete language errors. quote = candidate's exact words, issue = short explanation of the problem, suggestion = corrected version.
5. vocabularySuggestions: up to 5 cases where a stronger or more natural word/phrase would raise the Lexical Resource score. original = what was said, better = the upgrade.
6. pronunciationNotes: up to 4 specific observations heard in the audio (mispronounced words, flat intonation, stress issues). Empty array if pronunciation is consistently clear.
7. strengths: 2-3 things the candidate genuinely did well.
8. improvements: 2-3 highest-impact things to work on next.
9. modelAnswer: a natural band 8+ sample answer to the same question, matched to Part ${question.part} expected length (Part 1: 3-4 sentences, Part 2: ~200 words, Part 3: 4-6 sentences).

Calibration rules — follow strictly:
- Most real candidate answers fall in band 5.0-6.5. Award 7.0+ only when the descriptors are genuinely met. Never inflate scores to be encouraging.
- A very short answer (under 15 seconds for Part 1/3, under 60 seconds for Part 2) cannot score above 5.0 on Fluency & Coherence because the topic is not developed.
- If the audio is unintelligible or silent, set audioContainsSpeech to false.
- Feedback language: English, simple and direct (the candidate is a Vietnamese learner around band 5-7).

Return only valid JSON matching the schema.`;
    }

    private computeMetrics(transcript: string, dto: SubmitSpeakingAttemptDto): SpeakingMetrics {
        //đếm từ trên transcript verbatim
        const words = transcript
            .toLowerCase()
            .replace(/[^a-z'\s-]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 0);

        //đếm filler words riêng từng loại
        const fillerWords: Record<string, number> = {};
        let fillerWordCount = 0;
        for (const word of words) {
            if (FILLER_WORDS.includes(word)) {
                fillerWords[word] = (fillerWords[word] ?? 0) + 1;
                fillerWordCount++;
            }
        }

        const minutes = dto.durationSeconds / 60;
        const wordsPerMinute = minutes > 0 ? Math.round(words.length / minutes) : 0;

        return {
            wordCount: words.length,
            wordsPerMinute,
            fillerWordCount,
            fillerWords,
            pauseCount: dto.pauseCount ?? 0,
            totalPauseSeconds: Math.round((dto.totalPauseSeconds ?? 0) * 10) / 10,
            longPauseCount: dto.longPauseCount ?? 0,
        };
    }

    private callAndUpdateProsody = async (attemptId: number, audioUrl: string, transcript: string): Promise<void> => {
        const prosodyServiceUrl = this.configService.get<string>('PROSODY_SERVICE_URL');
        if (!prosodyServiceUrl) {
            //không cấu hình service → mark failed ngay để frontend không poll vô tận
            await this.attemptRepo.update(attemptId, { prosodyStatus: 'failed' }).catch(() => {});
            return;
        }
        try {
            await this.attemptRepo.update(attemptId, { prosodyStatus: 'processing' });
            const response = await fetch(`${prosodyServiceUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attempt_id: attemptId, audio_url: audioUrl, transcript }),
                signal: AbortSignal.timeout(120_000),
            });
            if (!response.ok) {
                throw new Error(`prosody service ${response.status}`);
            }
            const report = (await response.json()) as SpeakingProsody;
            await this.attemptRepo.update(attemptId, { prosody: report, prosodyStatus: 'done' });
        } catch (error) {
            this.logger.error(`Prosody failed for attempt ${attemptId}: ${(error as Error)?.message}`);
            await this.attemptRepo.update(attemptId, { prosodyStatus: 'failed' }).catch(() => {});
        }
    };

    private clampBand(value: number): number {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return 0;
        }
        //làm tròn về bội 0.5 trong khoảng 0-9
        const rounded = Math.round(value * 2) / 2;
        return Math.min(9, Math.max(0, rounded));
    }
}
