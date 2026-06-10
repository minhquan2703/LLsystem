import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartsOfSpeechService } from '@/modules/parts-of-speech/parts-of-speech.service';
import { PartsOfSpeechController } from '@/modules/parts-of-speech/parts-of-speech.controller';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PartOfSpeech])],
    controllers: [PartsOfSpeechController],
    providers: [PartsOfSpeechService],
    exports: [PartsOfSpeechService],
})
export class PartsOfSpeechModule {}
