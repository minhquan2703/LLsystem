import { Controller, Get } from '@nestjs/common';
import { EnglishWordsService } from './english-words.service';
import { ResponseMessage } from '@/decorator/customize';

@Controller('english-words')
export class EnglishWordsController {
    constructor(private readonly englishWordsService: EnglishWordsService) {}

    @Get('topics')
    @ResponseMessage('Lấy danh sách topics thành công')
    getTopics() {
        return this.englishWordsService.getTopics();
    }
}
