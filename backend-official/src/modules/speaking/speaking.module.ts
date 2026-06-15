import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeakingController } from '@/modules/speaking/speaking.controller';
import { SpeakingService } from '@/modules/speaking/speaking.service';
import { SpeakingQuestion } from '@/modules/speaking/entities/speaking-question.entity';
import { SpeakingAttempt } from '@/modules/speaking/entities/speaking-attempt.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SpeakingQuestion, SpeakingAttempt])],
    controllers: [SpeakingController],
    providers: [SpeakingService],
})
export class SpeakingModule {}
