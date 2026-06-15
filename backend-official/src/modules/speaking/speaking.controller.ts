import { Controller, Post, Get, Delete, Body, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { SpeakingService } from '@/modules/speaking/speaking.service';
import { SubmitSpeakingAttemptDto } from '@/modules/speaking/dto/submit-speaking-attempt.dto';
import { ResponseMessage } from '@/decorator/customize';

interface IAuthRequest extends Request {
    user: { _id: string; username: string }
}

@Controller('speaking')
export class SpeakingController {
    constructor(private readonly speakingService: SpeakingService) {}

    @Get('questions')
    @ResponseMessage('Lấy danh sách câu hỏi speaking thành công')
    getQuestions(@Query('part') part?: string) {
        const parsedPart = part ? parseInt(part, 10) : undefined;
        return this.speakingService.getQuestions(parsedPart);
    }

    @Post('attempts')
    @ResponseMessage('Chấm bài speaking thành công')
    submitAttempt(@Req() req: IAuthRequest, @Body() submitSpeakingAttemptDto: SubmitSpeakingAttemptDto) {
        return this.speakingService.submitAttempt(req.user._id, submitSpeakingAttemptDto);
    }

    @Get('attempts')
    @ResponseMessage('Lấy lịch sử speaking thành công')
    getHistory(@Req() req: IAuthRequest) {
        return this.speakingService.getHistory(req.user._id);
    }

    @Delete('attempts/:id')
    @ResponseMessage('Xóa bài speaking thành công')
    deleteAttempt(@Req() req: IAuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.speakingService.deleteAttempt(req.user._id, id);
    }
}
