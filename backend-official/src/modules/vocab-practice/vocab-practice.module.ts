import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSenseProgress } from './entities/user-sense-progress.entity';
import { VocabPracticeRun } from './entities/vocab-practice-run.entity';
import { VocabSession } from './entities/vocab-session.entity';
import { VocabAttempt } from './entities/vocab-attempt.entity';
import { VocabPracticeService } from './vocab-practice.service';
import { VocabPracticeController } from './vocab-practice.controller';
import { EnglishWordsModule } from '@/modules/english-words/english-words.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserSenseProgress, VocabPracticeRun, VocabSession, VocabAttempt]),
        EnglishWordsModule,
    ],
    controllers: [VocabPracticeController],
    providers: [VocabPracticeService],
})
export class VocabPracticeModule {}
