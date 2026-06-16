import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnglishWord } from './entities/english-word.entity';
import { EnglishWordSense } from './entities/english-word-sense.entity';
import { EnglishWordsService } from './english-words.service';
import { EnglishWordsController } from './english-words.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EnglishWord, EnglishWordSense])],
    controllers: [EnglishWordsController],
    providers: [EnglishWordsService],
    exports: [EnglishWordsService],
})
export class EnglishWordsModule {}
