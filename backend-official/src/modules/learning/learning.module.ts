import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningService } from '@/modules/learning/learning.service';
import { LearningController } from '@/modules/learning/learning.controller';
import { UserWord } from '@/modules/learning/entities/user-word.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserWord])],
    controllers: [LearningController],
    providers: [LearningService],
})
export class LearningModule {}
