import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PartsOfSpeechService } from '@/modules/parts-of-speech/parts-of-speech.service';
import { Public } from '@/decorator/customize';

@Controller('parts-of-speech')
export class PartsOfSpeechController {
    constructor(private readonly partsOfSpeechService: PartsOfSpeechService) {}

    @Get()
    @Public()
    @SkipThrottle()
    findAll() {
        return this.partsOfSpeechService.findAll();
    }

    @Get(':id')
    @Public()
    @SkipThrottle()
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.partsOfSpeechService.findOne(id);
    }
}
