import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { SchemaType } from '@google/generative-ai';
import type { ResponseSchema } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { AppErrorCode } from '@/common/errors.enum';
import { GeminiService } from '@/modules/gemini/gemini.service';
import { EnglishWordsService } from '@/modules/english-words/english-words.service';
import { EnglishWordSense } from '@/modules/english-words/entities/english-word-sense.entity';
import { UserSenseProgress, SenseProgressState } from './entities/user-sense-progress.entity';
import { VocabPracticeRun } from './entities/vocab-practice-run.entity';
import { VocabSession } from './entities/vocab-session.entity';
import { VocabAttempt } from './entities/vocab-attempt.entity';
import { StartRunDto } from './dto/start-run.dto';
import { SubmitSessionDto } from './dto/submit-session.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

const SENSES_PER_SESSION = 4;

// ── SM-2 constants (clone từ learning.service — tách util khi đủ 3 nơi dùng) ──

const LEECH_THRESHOLD = 8;
const MAX_INTERVAL = 365;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3.5;
const MATURE_INTERVAL_THRESHOLD = 21;
const LAPSE_INTERVAL_RETENTION = 0.20;
const NEAR_MISS_INTERVAL_RETENTION = 0.35;
const FUZZ_PERCENT = 0.05;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SM2Result {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReview: Date;
    lapseCount: number;
    streak: number;
    state: SenseProgressState;
    againToday: boolean;
    isLeech: boolean;
}

interface GradingAttemptResult {
    senseId: number;
    pendingSynonymValidations: { word: string; isValid: boolean }[];
    exampleBand: number;
    exampleFeedback: {
        isGrammaticallyCorrect: boolean;
        usesSenseCorrectly: boolean;
        improvement: string;
    };
}

interface GradingResponse {
    sessionNote: string;
    results: GradingAttemptResult[];
}

// ── Schema Gemini ─────────────────────────────────────────────────────────────

const GRADING_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        sessionNote: { type: SchemaType.STRING },
        results: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    senseId: { type: SchemaType.NUMBER },
                    pendingSynonymValidations: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                word: { type: SchemaType.STRING },
                                isValid: { type: SchemaType.BOOLEAN },
                            },
                        },
                    },
                    exampleBand: { type: SchemaType.NUMBER },
                    exampleFeedback: {
                        type: SchemaType.OBJECT,
                        properties: {
                            isGrammaticallyCorrect: { type: SchemaType.BOOLEAN },
                            usesSenseCorrectly: { type: SchemaType.BOOLEAN },
                            improvement: { type: SchemaType.STRING },
                        },
                    },
                },
            },
        },
    },
};

@Injectable()
export class VocabPracticeService {
    private readonly logger = new Logger(VocabPracticeService.name);

    constructor(
        @InjectRepository(UserSenseProgress)
        private userSenseProgressRepo: Repository<UserSenseProgress>,
        @InjectRepository(VocabPracticeRun)
        private vocabPracticeRunRepo: Repository<VocabPracticeRun>,
        @InjectRepository(VocabSession)
        private vocabSessionRepo: Repository<VocabSession>,
        @InjectRepository(VocabAttempt)
        private vocabAttemptRepo: Repository<VocabAttempt>,
        private readonly englishWordsService: EnglishWordsService,
        private readonly geminiService: GeminiService,
        private readonly configService: ConfigService,
    ) {}

    startRun = async (userId: string, dto: StartRunDto) => {
        const existingRun = await this.vocabPracticeRunRepo.findOne({
            where: { userId, completedAt: IsNull() },
        });
        if (existingRun) {
            throw new BadRequestException(AppErrorCode.VOCAB_RUN_ALREADY_ACTIVE);
        }

        const allTopics = await this.englishWordsService.getTopics();
        if (allTopics.length === 0) {
            throw new BadRequestException(AppErrorCode.VOCAB_NO_SENSES_AVAILABLE);
        }

        const topic = dto.targetTopic ?? allTopics[Math.floor(Math.random() * allTopics.length)];
        const sessionCount = dto.sessionCount ?? 10;

        const run = await this.vocabPracticeRunRepo.save(
            this.vocabPracticeRunRepo.create({
                userId,
                mode: dto.mode ?? 'topic',
                targetTopic: topic,
                sessionCount,
            }),
        );

        const senses = await this.pickSensesForSession(userId, topic, [], SENSES_PER_SESSION);
        if (senses.length === 0) {
            await this.vocabPracticeRunRepo.remove(run);
            throw new BadRequestException(AppErrorCode.VOCAB_NO_SENSES_AVAILABLE);
        }

        const session = await this.vocabSessionRepo.save(
            this.vocabSessionRepo.create({
                runId: run.id,
                userId,
                sessionIndex: 1,
                senseIds: senses.map(s => s.id),
            }),
        );

        return { run, session, senses };
    };

    finishRunEarly = async (userId: string) => {
        const run = await this.vocabPracticeRunRepo.findOne({
            where: { userId, completedAt: IsNull() },
        });
        if (!run) {
            throw new BadRequestException(AppErrorCode.VOCAB_RUN_NOT_FOUND);
        }
        run.completedAt = new Date();
        await this.vocabPracticeRunRepo.save(run);
    };

    getActiveRun = async (userId: string) => {
        const run = await this.vocabPracticeRunRepo.findOne({
            where: { userId, completedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
        if (!run) return null;

        const session = await this.vocabSessionRepo.findOne({
            where: { runId: run.id, isCompleted: false },
            order: { sessionIndex: 'ASC' },
        });
        if (!session) return null;

        const senses = await this.englishWordsService.getSensesByIds(session.senseIds);
        return { run, session, senses };
    };

    resumeRun = async (userId: string, runId: number) => {
        //không cho resume nếu user đang có active run khác
        const activeRun = await this.vocabPracticeRunRepo.findOne({
            where: { userId, completedAt: IsNull() },
        });
        if (activeRun) {
            throw new BadRequestException(AppErrorCode.VOCAB_RUN_ALREADY_ACTIVE);
        }

        const run = await this.vocabPracticeRunRepo.findOne({
            where: { id: runId, userId },
        });
        if (!run) {
            throw new BadRequestException(AppErrorCode.VOCAB_RUN_NOT_FOUND);
        }

        //kiểm tra còn session chưa hoàn thành không
        const incompleteSession = await this.vocabSessionRepo.findOne({
            where: { runId, isCompleted: false },
        });
        if (!incompleteSession) {
            throw new BadRequestException(AppErrorCode.VOCAB_RUN_NOT_FOUND);
        }

        run.completedAt = null;
        await this.vocabPracticeRunRepo.save(run);
    };

    saveDraft = async (userId: string, sessionId: number, dto: SaveDraftDto) => {
        const session = await this.vocabSessionRepo.findOne({
            where: { id: sessionId, userId },
        });
        if (!session || session.isCompleted) return;

        await this.vocabSessionRepo.update(sessionId, {
            draftAnswers: dto.answers,
            currentSenseIndex: dto.currentSenseIndex,
        });
    };

    getSession = async (userId: string, sessionId: number) => {
        const session = await this.vocabSessionRepo.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new BadRequestException(AppErrorCode.VOCAB_SESSION_NOT_FOUND);
        }
        const senses = await this.englishWordsService.getSensesByIds(session.senseIds);
        return { session, senses };
    };

    submitSession = async (userId: string, sessionId: number, dto: SubmitSessionDto) => {
        const session = await this.vocabSessionRepo.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new BadRequestException(AppErrorCode.VOCAB_SESSION_NOT_FOUND);
        }
        if (session.isCompleted) {
            throw new BadRequestException(AppErrorCode.VOCAB_SESSION_ALREADY_COMPLETED);
        }

        const senses = await this.englishWordsService.getSensesByIds(session.senseIds);
        const senseMap = new Map(senses.map(s => [s.id, s]));

        //salvar cada attempt com synonym score provisório
        for (const attemptDto of dto.attempts) {
            const sense = senseMap.get(attemptDto.senseId);
            if (!sense) continue;

            const provisionalScore = this.countMatchedSynonyms(attemptDto.synonymsInput, sense.synonyms);

            await this.vocabAttemptRepo.save(
                this.vocabAttemptRepo.create({
                    sessionId: session.id,
                    senseId: attemptDto.senseId,
                    synonymsInput: attemptDto.synonymsInput,
                    synonymScore: provisionalScore,
                    exampleInput: attemptDto.exampleInput ?? null,
                }),
            );
        }

        //marcar sessão como concluída e limpar draft
        await this.vocabSessionRepo.update(session.id, {
            isCompleted: true,
            completedAt: new Date(),
            draftAnswers: null,
            currentSenseIndex: 0,
        });

        //Gemini grade em background — fire and forget
        Promise.resolve()
            .then(() => this.gradeSessionAsync(session.id, userId))
            .catch(error => this.logger.error(`vocab grade async falhou (sessionId=${session.id})`, error));

        //atualizar run
        const run = await this.vocabPracticeRunRepo.findOne({ where: { id: session.runId } });
        run.completedSessions += 1;
        const runComplete = run.completedSessions >= run.sessionCount;
        if (runComplete) {
            run.completedAt = new Date();
        }
        await this.vocabPracticeRunRepo.save(run);

        if (runComplete) {
            return { nextSessionId: null, nextSenses: null, runComplete: true };
        }

        //criar próxima sessão
        const usedSenseIds = await this.getUsedSenseIds(run.id);
        const nextSenses = await this.pickSensesForSession(userId, run.targetTopic, usedSenseIds, SENSES_PER_SESSION);

        if (nextSenses.length === 0) {
            //todas as senses esgotadas — encerrar run antecipadamente
            run.completedAt = new Date();
            await this.vocabPracticeRunRepo.save(run);
            return { nextSessionId: null, nextSenses: null, runComplete: true };
        }

        const nextSession = await this.vocabSessionRepo.save(
            this.vocabSessionRepo.create({
                runId: run.id,
                userId,
                sessionIndex: session.sessionIndex + 1,
                senseIds: nextSenses.map(s => s.id),
            }),
        );

        return { nextSessionId: nextSession.id, nextSenses, runComplete: false };
    };

    getSessionResult = async (userId: string, sessionId: number) => {
        const session = await this.vocabSessionRepo.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new BadRequestException(AppErrorCode.VOCAB_SESSION_NOT_FOUND);
        }
        const attempts = await this.vocabAttemptRepo.find({
            where: { sessionId },
            relations: { sense: { word: true } },
        });
        const senses = await this.englishWordsService.getSensesByIds(session.senseIds);
        return { session, senses, attempts };
    };

    getHistory = async (userId: string) => {
        //lấy 15 run gần nhất, mỗi run kèm các session đã hoàn thành
        const runs = await this.vocabPracticeRunRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 15,
        });
        if (runs.length === 0) return [];

        const runIds = runs.map(r => r.id);
        const completedSessions = await this.vocabSessionRepo.find({
            where: { runId: In(runIds), isCompleted: true },
            order: { sessionIndex: 'ASC' },
        });
        const incompleteSessions = await this.vocabSessionRepo.find({
            where: { runId: In(runIds), isCompleted: false },
        });
        const incompleteRunIds = new Set(incompleteSessions.map(s => s.runId));

        return runs.map(run => ({
            run,
            sessions: completedSessions.filter(s => s.runId === run.id),
            //run bị kết thúc sớm (completedAt có) nhưng vẫn còn session chưa làm
            hasResumableSessions: run.completedAt !== null && incompleteRunIds.has(run.id),
        }));
    };

    // ── Grader async (fire-and-forget) ──────────────────────────────────────────

    private gradeSessionAsync = async (sessionId: number, userId: string): Promise<void> => {
        const attempts = await this.vocabAttemptRepo.find({
            where: { sessionId },
            relations: { sense: { word: true } },
        });
        if (attempts.length === 0) return;

        const attemptsWithPending = attempts.map(attempt => {
            //lọc bỏ input rỗng/whitespace/non-word trước khi gửi Gemini
            const pending = attempt.synonymsInput.filter(
                input => {
                    const trimmed = input.trim();
                    return trimmed.length >= 2
                        && /^[a-zA-Z\s\-]+$/.test(trimmed)
                        && !this.isSynonymMatch(trimmed, attempt.sense.synonyms);
                },
            );
            return { attempt, pending };
        });

        const promptText = this.buildGradingPrompt(attemptsWithPending);
        const vocabModel = this.configService.get<string>('GEMINI_VOCAB_MODEL') ?? 'gemini-3.1-flash-lite';

        let gradingResponse: GradingResponse;
        try {
            gradingResponse = await this.geminiService.generateStructured<GradingResponse>({
                model: vocabModel,
                schema: GRADING_SCHEMA,
                parts: [{ text: promptText }],
            });
        } catch (error) {
            this.logger.error(`vocab grading thất bại (sessionId=${sessionId}): ${(error as Error)?.message}`);
            //đánh dấu resolved để frontend không hiện "Đang chấm" mãi mãi
            await this.vocabAttemptRepo.update({ sessionId }, { resolved: true });
            return;
        }

        //atualizar geminiNote da sessão
        await this.vocabSessionRepo.update(sessionId, { geminiNote: gradingResponse.sessionNote });

        //processar cada resultado
        const gradedSenseIds = new Set<number>();
        for (const result of gradingResponse.results) {
            const found = attemptsWithPending.find(a => a.attempt.senseId === result.senseId);
            if (!found) continue;
            const { attempt, pending } = found;
            gradedSenseIds.add(attempt.senseId);

            //recalcular score final com validações Gemini
            const matchedCount = this.countMatchedSynonyms(attempt.synonymsInput, attempt.sense.synonyms);
            let approvedCount = 0;
            let rejectedCount = 0;
            const newApprovedSynonyms: string[] = [];

            const returnedWords = new Set(
                (result.pendingSynonymValidations ?? []).map(v => v.word.toLowerCase().trim()),
            );

            for (const validation of result.pendingSynonymValidations ?? []) {
                if (pending.includes(validation.word.toLowerCase().trim()) || pending.includes(validation.word)) {
                    if (validation.isValid) {
                        approvedCount++;
                        newApprovedSynonyms.push(validation.word.toLowerCase().trim());
                    } else {
                        rejectedCount++;
                    }
                }
            }

            //penalize pending items Gemini bỏ qua không trả về (thường là từ lạ/sai hoàn toàn)
            for (const pendingWord of pending) {
                if (!returnedWords.has(pendingWord.toLowerCase().trim())) {
                    rejectedCount++;
                }
            }

            //expandir set de synonyms com palavras aprovadas pelo Gemini
            if (newApprovedSynonyms.length > 0) {
                await this.englishWordsService.addSynonymsToSense(attempt.senseId, newApprovedSynonyms);
            }

            const finalSynonymScore = matchedCount + approvedCount - rejectedCount;
            const exampleBand = attempt.exampleInput ? this.clampBand(result.exampleBand) : null;

            await this.vocabAttemptRepo.update(attempt.id, {
                synonymScore: finalSynonymScore,
                exampleBand,
                exampleFeedback: attempt.exampleInput ? result.exampleFeedback : null,
                resolved: true,
            });

            await this.updateSenseProgress(userId, attempt.senseId, finalSynonymScore, exampleBand);
        }

        //đánh dấu resolved cho các attempt mà Gemini bỏ sót (không trả về senseId)
        const skipped = attemptsWithPending.filter(a => !gradedSenseIds.has(a.attempt.senseId));
        for (const { attempt } of skipped) {
            await this.vocabAttemptRepo.update(attempt.id, { resolved: true });
        }
    };

    private buildGradingPrompt = (
        attemptsWithPending: { attempt: VocabAttempt; pending: string[] }[],
    ): string => {
        const wordSections = attemptsWithPending
            .map(({ attempt, pending }, index) => {
                const { sense } = attempt;
                const lines = [
                    `Word ${index + 1}: "${sense.word.lemma}" (${sense.pos ?? 'word'}) — senseId=${sense.id}`,
                    `Meaning: ${sense.glossEn}`,
                    `User example: ${attempt.exampleInput ? `"${attempt.exampleInput}"` : '(none provided)'}`,
                    `Synonyms to validate: ${pending.length > 0 ? pending.join(', ') : '(none)'}`,
                ];
                return lines.join('\n');
            })
            .join('\n\n');

        return [
            'You are an IELTS vocabulary teacher grading a student\'s practice session.',
            '',
            'For each word below:',
            '1. Validate any pending synonyms: is each word a valid synonym for that specific sense/meaning?',
            '2. Grade the example sentence on IELTS Lexical Resource band (0-9, steps of 0.5):',
            '   0-3: wrong meaning or incomprehensible',
            '   4-4.5: basic but correct',
            '   5-5.5: clear understanding, minor errors ok',
            '   6-6.5: appropriate and accurate',
            '   7-7.5: natural, varied, good collocation',
            '   8-9: sophisticated and precise',
            '   If no example provided, set exampleBand to 0.',
            '3. Note if example is grammatically correct and uses the sense correctly.',
            '',
            'Return senseId exactly as shown. Include ALL words in results array.',
            '',
            wordSections,
            '',
            'End with a sessionNote: 2-3 sentence overall feedback on vocabulary performance.',
        ].join('\n');
    };

    // ── SM-2 ─────────────────────────────────────────────────────────────────────

    private updateSenseProgress = async (
        userId: string,
        senseId: number,
        synonymScore: number | null,
        exampleBand: number | null,
    ): Promise<void> => {
        let progress = await this.userSenseProgressRepo.findOne({ where: { userId, senseId } });
        if (!progress) {
            //TypeORM .create() không tự điền default từ decorator vào object TS
            //phải set tường minh để tránh undefined gây NaN trong tính toán SM-2
            progress = this.userSenseProgressRepo.create({
                userId,
                senseId,
                repetitions: 0,
                easeFactor: 2.5,
                interval: 1,
                lapseCount: 0,
                streak: 0,
                state: 'new',
            });
        }

        const quality = this.computeQuality(synonymScore, exampleBand);
        const sm2Result = this.calculateSpacedRepetition(
            quality,
            progress.repetitions,
            progress.easeFactor,
            progress.interval,
            progress.lapseCount,
            progress.streak,
        );

        Object.assign(progress, {
            repetitions: sm2Result.repetitions,
            easeFactor: sm2Result.easeFactor,
            interval: sm2Result.interval,
            nextReview: sm2Result.nextReview,
            lapseCount: sm2Result.lapseCount,
            streak: sm2Result.streak,
            state: sm2Result.state,
            lastReview: new Date(),
        });

        await this.userSenseProgressRepo.save(progress);
    };

    private computeQuality = (synonymScore: number | null, exampleBand: number | null): number => {
        let quality = 3; //neutral nếu không có gì để đo

        if (exampleBand !== null) {
            if (exampleBand < 4) quality = 0;
            else if (exampleBand < 5) quality = 1;
            else if (exampleBand < 6) quality = 2;
            else if (exampleBand < 6.5) quality = 3;
            else if (exampleBand < 7.5) quality = 4;
            else quality = 5;
        }

        //synonym fail nặng → cap quality để SRS schedule lại sớm
        if (synonymScore !== null && synonymScore <= 0) {
            quality = Math.min(2, quality);
        }

        return quality;
    };

    private calculateSpacedRepetition = (
        quality: number,
        repetitions: number,
        easeFactor: number,
        interval: number,
        lapseCount: number,
        streak: number,
    ): SM2Result => {
        const isCorrect = quality >= 3;
        let newRepetitions = repetitions;
        let newEaseFactor = easeFactor;
        let newInterval = interval;
        let newLapseCount = lapseCount;
        let newStreak = streak;
        let againToday = false;

        if (isCorrect) {
            if (newRepetitions === 0) {
                newInterval = 1;
            } else if (newRepetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(newInterval * newEaseFactor);
            }

            if (newInterval > 2) {
                const fuzzRange = Math.max(1, Math.round(newInterval * FUZZ_PERCENT));
                newInterval += Math.floor(Math.random() * (2 * fuzzRange + 1)) - fuzzRange;
            }

            newInterval = Math.min(newInterval, MAX_INTERVAL);
            newEaseFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
            if (quality === 5) newEaseFactor += 0.05;
            newEaseFactor = Math.min(Math.max(newEaseFactor, MIN_EASE_FACTOR), MAX_EASE_FACTOR);
            newRepetitions++;
            newStreak++;
        } else {
            newLapseCount++;
            newStreak = 0;

            if (quality === 2) {
                newInterval = Math.max(1, Math.round(interval * NEAR_MISS_INTERVAL_RETENTION));
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.10);
            } else if (quality === 1) {
                newInterval = repetitions >= 2
                    ? Math.max(1, Math.round(interval * LAPSE_INTERVAL_RETENTION))
                    : 1;
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.20);
                againToday = true;
            } else {
                newInterval = 1;
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.30);
                againToday = true;
            }

            newRepetitions = 0;
        }

        const isLeech = newLapseCount >= LEECH_THRESHOLD;
        const newState = this.resolveState(isLeech, newRepetitions, newLapseCount, newInterval);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        return {
            repetitions: newRepetitions,
            easeFactor: newEaseFactor,
            interval: newInterval,
            nextReview,
            lapseCount: newLapseCount,
            streak: newStreak,
            state: newState,
            againToday,
            isLeech,
        };
    };

    private resolveState = (
        isLeech: boolean,
        repetitions: number,
        lapseCount: number,
        interval: number,
    ): SenseProgressState => {
        if (isLeech) return 'suspended';
        if (repetitions === 0 && lapseCount === 0) return 'new';
        if (interval >= MATURE_INTERVAL_THRESHOLD) return 'review';
        return 'learning';
    };

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private pickSensesForSession = async (
        userId: string,
        topic: string,
        excludeSenseIds: number[],
        count: number,
    ): Promise<EnglishWordSense[]> => {
        const allTopicSenses = await this.englishWordsService.getSensesByTopic(topic);
        const available = allTopicSenses.filter(s => !excludeSenseIds.includes(s.id));
        if (available.length === 0) return [];

        const progressList = await this.userSenseProgressRepo.find({
            where: { userId, senseId: In(available.map(s => s.id)) },
        });
        const progressMap = new Map(progressList.map(p => [p.senseId, p]));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isDue = (senseId: number): boolean => {
            const progress = progressMap.get(senseId);
            if (!progress) return true;
            if (progress.state === 'suspended') return false;
            return new Date(progress.nextReview) <= today;
        };

        //sort: due first → academic tier first → random
        const sorted = [...available].sort((senseA, senseB) => {
            const aDue = isDue(senseA.id) ? 0 : 1;
            const bDue = isDue(senseB.id) ? 0 : 1;
            if (aDue !== bDue) return aDue - bDue;
            const aTier = senseA.tier === 'academic' ? 0 : 1;
            const bTier = senseB.tier === 'academic' ? 0 : 1;
            if (aTier !== bTier) return aTier - bTier;
            return Math.random() - 0.5;
        });

        return sorted.slice(0, count);
    };

    private getUsedSenseIds = async (runId: number): Promise<number[]> => {
        const sessions = await this.vocabSessionRepo.find({ where: { runId } });
        const allIds = sessions.flatMap(s => s.senseIds as number[]);
        return [...new Set(allIds)];
    };

    private countMatchedSynonyms = (userInputs: string[], senseSynonyms: string[]): number => {
        return userInputs.filter(input => this.isSynonymMatch(input, senseSynonyms)).length;
    };

    private isSynonymMatch = (input: string, senseSynonyms: string[]): boolean => {
        const normalized = input.toLowerCase().trim();
        return senseSynonyms.some(s => s.toLowerCase().trim() === normalized);
    };

    private clampBand = (band: number | null | undefined): number | null => {
        if (band == null || !isFinite(band)) return null;
        const clamped = Math.max(0, Math.min(9, band));
        return Math.round(clamped * 2) / 2;
    };
}
