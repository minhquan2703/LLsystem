import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, Not } from 'typeorm';
import { UserWord, UserWordState } from '@/modules/learning/entities/user-word.entity';
import { AddWordDto } from '@/modules/learning/dto/add-word.dto';
import { ReviewDto } from '@/modules/learning/dto/review.dto';

// ── SM-2 constants ─────────────────────────────────────────────────────────────

//từ bị quên >= ngưỡng này → leech, tự động suspend
const LEECH_THRESHOLD = 8;
//interval tối đa 1 năm, tránh card biến mất quá lâu
const MAX_INTERVAL = 365;
const MIN_EASE_FACTOR = 1.3;
//giới hạn trên để EF không tăng vô hạn trên những từ quá dễ
const MAX_EASE_FACTOR = 3.5;
//interval >= ngưỡng này → từ "thành thục" (mature), state=review
const MATURE_INTERVAL_THRESHOLD = 21;
//khi quên hoàn toàn (q=0 hoặc 1): interval * tỷ lệ này, không về 1 nếu từ đã học lâu
const LAPSE_INTERVAL_RETENTION = 0.20;
//khi gần đúng (q=2): penalty nhẹ hơn
const NEAR_MISS_INTERVAL_RETENTION = 0.35;
//thêm ±FUZZ_PERCENT% ngẫu nhiên vào interval để tránh review mountain
const FUZZ_PERCENT = 0.05;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SM2Result {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReview: Date;
    lapseCount: number;
    streak: number;
    state: UserWordState;
    //true = cần hiện lại card ngay trong session hôm nay (q=0 hoặc q=1)
    againToday: boolean;
    //true = từ bị quên quá nhiều lần, frontend nên cảnh báo người dùng
    isLeech: boolean;
}

@Injectable()
export class LearningService {
    constructor(
        @InjectRepository(UserWord)
        private userWordRepo: Repository<UserWord>,
    ) {}

    async getDue(userId: string) {
        //suspended words bị loại khỏi queue thông thường
        const dueWords = await this.userWordRepo.find({
            where: {
                userId,
                nextReview: Raw(col => `${col} <= CURRENT_DATE`),
                state: Not('suspended' as UserWordState),
            },
            relations: { word: true },
            //new cards sort trước để người học gặp từ mới sớm, rồi mới đến backlog review
            order: { state: 'ASC', nextReview: 'ASC' },
        });

        const [totalLearned, suspendedCount] = await Promise.all([
            this.userWordRepo.count({ where: { userId } }),
            this.userWordRepo.count({ where: { userId, state: 'suspended' } }),
        ]);

        const newCount = dueWords.filter(w => w.state === 'new').length;
        const reviewCount = dueWords.filter(w => w.state === 'review').length;
        const learningCount = dueWords.filter(w => w.state === 'learning').length;

        return {
            dueCount: dueWords.length,
            newCount,
            learningCount,
            reviewCount,
            total: totalLearned,
            suspendedCount,
            words: dueWords,
        };
    }

    async getStats(userId: string) {
        const [total, dueToday, newCount, learningCount, reviewCount, suspendedCount] = await Promise.all([
            this.userWordRepo.count({ where: { userId } }),
            this.userWordRepo.count({
                where: {
                    userId,
                    nextReview: Raw(col => `${col} <= CURRENT_DATE`),
                    state: Not('suspended' as UserWordState),
                },
            }),
            this.userWordRepo.count({ where: { userId, state: 'new' } }),
            this.userWordRepo.count({ where: { userId, state: 'learning' } }),
            this.userWordRepo.count({ where: { userId, state: 'review' } }),
            this.userWordRepo.count({ where: { userId, state: 'suspended' } }),
        ]);

        return { total, dueToday, newCount, learningCount, reviewCount, suspendedCount };
    }

    async addWord(userId: string, addWordDto: AddWordDto) {
        const existingEntry = await this.userWordRepo.findOne({ where: { userId, wordId: addWordDto.wordId } });
        if (existingEntry) {
            throw new BadRequestException(AppErrorCode.WORD_ALREADY_IN_LIST);
        }
        const newEntry = this.userWordRepo.create({ userId, wordId: addWordDto.wordId });
        return await this.userWordRepo.save(newEntry);
    }

    async review(userId: string, reviewDto: ReviewDto) {
        const userWord = await this.userWordRepo.findOne({
            where: { id: reviewDto.userWordId, userId },
        });
        if (!userWord) {
            throw new BadRequestException(AppErrorCode.LEARNING_ENTRY_NOT_FOUND);
        }

        const sm2Result = this.calculateSpacedRepetition(
            reviewDto.quality,
            userWord.repetitions,
            userWord.easeFactor,
            userWord.interval,
            userWord.lapseCount,
            userWord.streak,
        );

        Object.assign(userWord, {
            repetitions: sm2Result.repetitions,
            easeFactor: sm2Result.easeFactor,
            interval: sm2Result.interval,
            nextReview: sm2Result.nextReview,
            lapseCount: sm2Result.lapseCount,
            streak: sm2Result.streak,
            state: sm2Result.state,
            lastReview: new Date(),
        });

        const savedUserWord = await this.userWordRepo.save(userWord);

        return {
            userWord: savedUserWord,
            againToday: sm2Result.againToday,
            isLeech: sm2Result.isLeech,
        };
    }

    async unsuspend(userId: string, userWordId: number) {
        const userWord = await this.userWordRepo.findOne({
            where: { id: userWordId, userId },
        });
        if (!userWord) {
            throw new BadRequestException(AppErrorCode.LEARNING_ENTRY_NOT_FOUND);
        }
        //reset về learning với interval=1 — từ xuất hiện lại ngay ngày hôm nay
        userWord.state = 'learning';
        userWord.interval = 1;
        userWord.repetitions = 0;
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);
        userWord.nextReview = nextReview;
        return await this.userWordRepo.save(userWord);
    }

    // ── SM-2 Advanced ────────────────────────────────────────────────────────────

    private calculateSpacedRepetition(
        quality: number,
        repetitions: number,
        easeFactor: number,
        interval: number,
        lapseCount: number,
        streak: number,
    ): SM2Result {
        const isCorrect = quality >= 3;
        let newRepetitions = repetitions;
        let newEaseFactor = easeFactor;
        let newInterval = interval;
        let newLapseCount = lapseCount;
        let newStreak = streak;
        let againToday = false;

        if (isCorrect) {
            //tính interval mới dựa trên số lần học liên tiếp thành công
            if (newRepetitions === 0) {
                newInterval = 1;
            } else if (newRepetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(newInterval * newEaseFactor);
            }

            //fuzz factor: thêm nhiễu ngẫu nhiên ±5% cho interval > 2 ngày
            //ngăn nhiều card khác nhau cùng đến hạn 1 ngày (review mountain)
            if (newInterval > 2) {
                const fuzzRange = Math.max(1, Math.round(newInterval * FUZZ_PERCENT));
                newInterval += Math.floor(Math.random() * (2 * fuzzRange + 1)) - fuzzRange;
            }

            newInterval = Math.min(newInterval, MAX_INTERVAL);

            //công thức SM-2 chuẩn cập nhật ease factor
            newEaseFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
            //bonus nhỏ cho perfect recall (q=5): reward từ nhớ rất chắc
            if (quality === 5) {
                newEaseFactor += 0.05;
            }
            newEaseFactor = Math.min(Math.max(newEaseFactor, MIN_EASE_FACTOR), MAX_EASE_FACTOR);

            newRepetitions++;
            newStreak++;
        } else {
            //lapse — quên từ
            newLapseCount++;
            newStreak = 0;

            if (quality === 2) {
                //gần đúng: nhớ ra sau khi thấy đáp án, penalty nhẹ nhất trong nhóm sai
                //giữ lại 35% interval — không reset về 1 vì vẫn còn vết nhớ
                newInterval = Math.max(1, Math.round(interval * NEAR_MISS_INTERVAL_RETENTION));
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.10);
            } else if (quality === 1) {
                //sai nhưng thấy đáp án có vẻ quen: penalty trung bình
                //từ đã học lâu (repetitions >= 2) giữ 20% interval, từ mới thì về 1
                newInterval = repetitions >= 2
                    ? Math.max(1, Math.round(interval * LAPSE_INTERVAL_RETENTION))
                    : 1;
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.20);
                againToday = true;
            } else {
                //quality=0: blackout hoàn toàn — không nhớ gì, penalty nặng nhất
                newInterval = 1;
                newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.30);
                againToday = true;
            }

            //reset repetitions sau mọi lapse — chuỗi interval phải bắt đầu lại
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
    }

    private resolveState(
        isLeech: boolean,
        repetitions: number,
        lapseCount: number,
        interval: number,
    ): UserWordState {
        if (isLeech) {
            return 'suspended';
        }
        //chưa có lịch sử gì (mới add, chưa từng review lần nào)
        if (repetitions === 0 && lapseCount === 0) {
            return 'new';
        }
        //interval đạt ngưỡng thành thục → từ đã ổn định trong long-term memory
        if (interval >= MATURE_INTERVAL_THRESHOLD) {
            return 'review';
        }
        return 'learning';
    }
}
