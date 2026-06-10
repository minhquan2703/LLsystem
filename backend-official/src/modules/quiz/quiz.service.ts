import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Word } from '@/modules/words/entities/word.entity';
import { UserWord } from '@/modules/learning/entities/user-word.entity';
import { QuizAttempt } from '@/modules/quiz/entities/quiz-attempt.entity';
import { User } from '@/modules/users/entities/user.entity';
import { GenerateQuizDto, QuizDirection, QuizLanguage, QuizWordSource } from '@/modules/quiz/dto/generate-quiz.dto';
import { SaveQuizAttemptDto } from '@/modules/quiz/dto/save-quiz-attempt.dto';

//số từ lấy thêm làm nguồn đáp án nhiễu, ngoài chính các từ được hỏi
const DISTRACTOR_POOL_SIZE = 150;

export interface GeneratedQuestion {
    wordId: number;
    promptText: string;
    promptSub: string | null;
    options: string[];
    correctIndex: number;
}

@Injectable()
export class QuizService {
    constructor(
        @InjectRepository(Word)
        private wordsRepo: Repository<Word>,

        @InjectRepository(UserWord)
        private userWordRepo: Repository<UserWord>,

        @InjectRepository(QuizAttempt)
        private quizAttemptRepo: Repository<QuizAttempt>,

        @InjectRepository(User)
        private usersRepo: Repository<User>,
    ) {}

    async generate(userId: string, dto: GenerateQuizDto) {
        const { direction, questionCount, optionCount, language, topicIds } = dto;
        const wordSource = dto.wordSource ?? 'mixed';
        const hskLevels = await this.resolveHskLevels(userId, dto.hskLevels);

        const userWords = await this.userWordRepo.find({
            where: { userId },
            relations: { word: { topics: true } },
        });
        const userWordIds = userWords.map((entry) => entry.wordId);
        const studyWords = this.shuffle(
            userWords
                .map((entry) => entry.word)
                .filter((word) => word && this.hasMeaning(word, language) && this.matchesFilter(word, topicIds, hskLevels)),
        );

        const targets = await this.pickTargets(wordSource, studyWords, userWordIds, questionCount, language, topicIds, hskLevels);

        //gộp các từ được hỏi với một pool ngẫu nhiên để có đủ nguồn đáp án nhiễu
        const extraPool = await this.fetchRandomWords(language, DISTRACTOR_POOL_SIZE, []);
        const poolById = new Map<number, Word>();
        for (const word of [...extraPool, ...targets]) {
            poolById.set(word.id, word);
        }
        const distractorPool = [...poolById.values()];

        const questions = targets.map((target) =>
            this.buildQuestion(target, distractorPool, optionCount, direction, language),
        );

        return { questions };
    }

    async saveAttempt(userId: string, dto: SaveQuizAttemptDto): Promise<QuizAttempt> {
        const { wrongWordIds, ...attemptData } = dto;
        const attempt = this.quizAttemptRepo.create({ ...attemptData, userId });
        const savedAttempt = await this.quizAttemptRepo.save(attempt);

        if (wrongWordIds?.length) {
            await this.addWordsToReviewList(userId, wrongWordIds);
        }

        return savedAttempt;
    }

    //thêm các từ trả lời sai trong quiz vào danh sách ôn tập SM-2, bỏ qua từ đã có sẵn
    private async addWordsToReviewList(userId: string, wordIds: number[]): Promise<void> {
        const uniqueWordIds = [...new Set(wordIds)];
        const existingEntries = await this.userWordRepo.find({
            where: { userId, wordId: In(uniqueWordIds) },
        });
        const existingWordIds = new Set(existingEntries.map((entry) => entry.wordId));
        const newEntries = uniqueWordIds
            .filter((wordId) => !existingWordIds.has(wordId))
            .map((wordId) => this.userWordRepo.create({ userId, wordId }));

        if (newEntries.length) {
            await this.userWordRepo.save(newEntries);
        }
    }

    async getHistory(userId: string, limit = 20): Promise<QuizAttempt[]> {
        return this.quizAttemptRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getStats(userId: string) {
        const attempts = await this.quizAttemptRepo.find({ where: { userId } });
        if (attempts.length === 0) {
            return { totalAttempts: 0, averageScore: 0, bestScore: 0, totalQuestionsAnswered: 0, totalCorrect: 0 };
        }

        const scores = attempts.map((attempt) => Math.round((attempt.correctCount / attempt.questionCount) * 100));
        const totalQuestionsAnswered = attempts.reduce((sum, attempt) => sum + attempt.questionCount, 0);
        const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correctCount, 0);

        return {
            totalAttempts: attempts.length,
            averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
            bestScore: Math.max(...scores),
            totalQuestionsAnswered,
            totalCorrect,
        };
    }

    private async pickTargets(
        wordSource: QuizWordSource,
        studyWords: Word[],
        userWordIds: number[],
        questionCount: number,
        language: QuizLanguage,
        topicIds?: number[],
        hskLevels?: number[],
    ): Promise<Word[]> {
        if (wordSource === 'mine') {
            return studyWords.slice(0, questionCount);
        }

        if (wordSource === 'new') {
            return this.fetchRandomWords(language, questionCount, userWordIds, topicIds, hskLevels);
        }

        //mixed: ưu tiên hỏi các từ user đang học, thiếu thì bù bằng từ ngẫu nhiên
        let targets = studyWords.slice(0, questionCount);
        if (targets.length < questionCount) {
            const topUp = await this.fetchRandomWords(
                language,
                questionCount - targets.length,
                targets.map((word) => word.id),
                topicIds,
                hskLevels,
            );
            targets = [...targets, ...topUp];
        }
        return targets;
    }

    //chưa truyền filter HSK tường minh thì lấy level đã lưu của user làm ngưỡng trần
    //vd user lưu HSK3 thì xem như chọn [1,2,3] — vẫn lẫn từ ôn cấp thấp hơn cho đa dạng
    private async resolveHskLevels(userId: string, explicitLevels?: number[]): Promise<number[] | undefined> {
        if (explicitLevels?.length) {
            return explicitLevels;
        }
        const user = await this.usersRepo.findOneBy({ id: userId });
        if (!user?.hskLevel) {
            return undefined;
        }
        return Array.from({ length: user.hskLevel }, (_, index) => index + 1);
    }

    private matchesFilter(word: Word, topicIds?: number[], hskLevels?: number[]): boolean {
        if (hskLevels?.length && !hskLevels.includes(word.hskLevel)) {
            return false;
        }
        if (topicIds?.length) {
            const wordTopicIds = (word.topics ?? []).map((topic) => topic.id);
            if (!topicIds.some((id) => wordTopicIds.includes(id))) {
                return false;
            }
        }
        return true;
    }

    private buildQuestion(
        target: Word,
        pool: Word[],
        optionCount: number,
        direction: QuizDirection,
        language: QuizLanguage,
    ): GeneratedQuestion {
        const displayOf = (word: Word) =>
            direction === 'zh-to-meaning' ? this.getMeaning(word, language) : word.simplified;

        const correctText = displayOf(target);
        const promptText = direction === 'zh-to-meaning' ? target.simplified : this.getMeaning(target, language);
        const promptSub = direction === 'zh-to-meaning' ? target.pinyin || null : null;

        //ưu tiên đáp án nhiễu cùng HSK level cho khó hơn, dedupe theo text hiển thị
        const sameLevel: string[] = [];
        const otherLevel: string[] = [];
        const seen = new Set<string>([correctText]);
        for (const word of pool) {
            if (word.id === target.id) {
                continue;
            }
            const text = displayOf(word);
            if (!text || seen.has(text)) {
                continue;
            }
            seen.add(text);
            if (word.hskLevel === target.hskLevel) {
                sameLevel.push(text);
            } else {
                otherLevel.push(text);
            }
        }

        const distractors = [...this.shuffle(sameLevel), ...this.shuffle(otherLevel)].slice(
            0,
            Math.max(1, optionCount - 1),
        );

        //chèn đáp án đúng vào vị trí ngẫu nhiên
        const options = [...distractors];
        const correctIndex = Math.floor(Math.random() * (options.length + 1));
        options.splice(correctIndex, 0, correctText);

        return {
            wordId: target.id,
            promptText,
            promptSub,
            options,
            correctIndex,
        };
    }

    private fetchRandomWords(
        language: QuizLanguage,
        limit: number,
        excludeIds: number[],
        topicIds?: number[],
        hskLevels?: number[],
    ) {
        if (limit <= 0) {
            return Promise.resolve([] as Word[]);
        }
        const queryBuilder = this.wordsRepo
            .createQueryBuilder('word')
            .where('word.hskLevel IS NOT NULL')
            .andWhere(language === 'vi' ? 'word.vietnameseDef IS NOT NULL' : 'word.englishDef IS NOT NULL');
        if (excludeIds.length) {
            queryBuilder.andWhere('word.id NOT IN (:...excludeIds)', { excludeIds });
        }
        if (hskLevels?.length) {
            queryBuilder.andWhere('word.hskLevel IN (:...hskLevels)', { hskLevels });
        }
        if (topicIds?.length) {
            queryBuilder.innerJoin('word.topics', 'topic', 'topic.id IN (:...topicIds)', { topicIds });
        }
        return queryBuilder.orderBy('RANDOM()').take(limit).getMany();
    }

    private hasMeaning(word: Word, language: QuizLanguage): boolean {
        return language === 'vi' ? !!word.vietnameseDef : !!word.englishDef;
    }

    private getMeaning(word: Word, language: QuizLanguage): string {
        if (language === 'vi') {
            return word.vietnameseDef || word.englishDef || '';
        }
        return word.englishDef || word.vietnameseDef || '';
    }

    private shuffle<T>(items: T[]): T[] {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}
