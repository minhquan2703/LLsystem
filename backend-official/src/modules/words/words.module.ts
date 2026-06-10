import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordsService } from '@/modules/words/words.service';
import { WordsController } from '@/modules/words/words.controller';
import { Word } from '@/modules/words/entities/word.entity';
import { Topic } from '@/modules/topics/entities/topic.entity';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Word, Topic, PartOfSpeech])],
  controllers: [WordsController],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}
