import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from '@/modules/quiz/quiz.service';
import { QuizController } from '@/modules/quiz/quiz.controller';
import { Word } from '@/modules/words/entities/word.entity';
import { UserWord } from '@/modules/learning/entities/user-word.entity';
import { QuizAttempt } from '@/modules/quiz/entities/quiz-attempt.entity';
import { User } from '@/modules/users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Word, UserWord, QuizAttempt, User])],
    controllers: [QuizController],
    providers: [QuizService],
})
export class QuizModule {}
