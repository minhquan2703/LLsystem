import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordsService } from '@/modules/words/words.service';
import { WordsController } from '@/modules/words/words.controller';
import { Word } from '@/modules/words/entities/word.entity';
import { Topic } from '@/modules/topics/entities/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Word, Topic])],
  controllers: [WordsController],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}
