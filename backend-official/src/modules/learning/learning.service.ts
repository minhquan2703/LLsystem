import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { UserWord } from '@/modules/learning/entities/user-word.entity';
import { AddWordDto } from '@/modules/learning/dto/add-word.dto';
import { ReviewDto } from '@/modules/learning/dto/review.dto';

@Injectable()
export class LearningService {
    constructor(
        @InjectRepository(UserWord)
        private userWordRepo: Repository<UserWord>,
    ) {}

    async getDue(userId: string) {
        const dueWords = await this.userWordRepo.find({
            where: { userId, nextReview: Raw(col => `${col} <= CURRENT_DATE`) },
            relations: { word: true },
            order: { nextReview: 'ASC' },
        });
        const totalLearned = await this.userWordRepo.count({ where: { userId } });
        return { dueCount: dueWords.length, total: totalLearned, words: dueWords };
    }

    async getStats(userId: string) {
        const [total, dueToday] = await Promise.all([
            this.userWordRepo.count({ where: { userId } }),
            this.userWordRepo.count({
                where: { userId, nextReview: Raw(col => `${col} <= CURRENT_DATE`) },
            }),
        ]);
        return { total, dueToday };
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
        const userWord = await this.userWordRepo.findOne({ where: { id: reviewDto.userWordId, userId } });
        if (!userWord) {
            throw new BadRequestException(AppErrorCode.LEARNING_ENTRY_NOT_FOUND);
        }
        const updatedSchedule = this.calculateSpacedRepetition(
            reviewDto.quality,
            userWord.repetitions,
            userWord.easeFactor,
            userWord.interval,
        );
        Object.assign(userWord, updatedSchedule, { lastReview: new Date() });
        return await this.userWordRepo.save(userWord);
    }

    //thuật toán SM-2 tính lịch ôn tập tiếp theo dựa trên chất lượng trả lời
    private calculateSpacedRepetition(
        quality: number,
        repetitions: number,
        easeFactor: number,
        interval: number,
    ) {
        let newRepetitions = repetitions;
        let newEaseFactor = easeFactor;
        let newInterval = interval;

        if (quality >= 3) {
            //câu trả lời đúng: tính khoảng cách ôn tập mới
            if (newRepetitions === 0) {
                newInterval = 1;
            } else if (newRepetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(newInterval * newEaseFactor);
            }
            newRepetitions++;

            //cập nhật hệ số dễ theo công thức SM-2
            newEaseFactor = newEaseFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
            if (newEaseFactor < 1.3) {
                newEaseFactor = 1.3;
            }
        } else {
            //câu trả lời sai: reset về đầu
            newRepetitions = 0;
            newInterval = 1;
        }

        //tính ngày ôn tập tiếp theo
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        return { repetitions: newRepetitions, easeFactor: newEaseFactor, interval: newInterval, nextReview };
    }
}
