import { Body, Controller, Get, Param, ParseIntPipe, Post, Patch, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { VocabPracticeService } from './vocab-practice.service';
import { StartRunDto } from './dto/start-run.dto';
import { SubmitSessionDto } from './dto/submit-session.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { ResponseMessage } from '@/decorator/customize';

interface IAuthRequest extends Request {
    user: { _id: string; username: string };
}

@Controller('vocab-practice')
export class VocabPracticeController {
    constructor(private readonly vocabPracticeService: VocabPracticeService) {}

    @Post('runs')
    @ResponseMessage('Bắt đầu buổi luyện từ vựng thành công')
    startRun(@Req() req: IAuthRequest, @Body() dto: StartRunDto) {
        return this.vocabPracticeService.startRun(req.user._id, dto);
    }

    @Patch('runs/finish')
    @ResponseMessage('Kết thúc buổi luyện sớm thành công')
    finishRunEarly(@Req() req: IAuthRequest) {
        return this.vocabPracticeService.finishRunEarly(req.user._id);
    }

    @Post('runs/:id/resume')
    @ResponseMessage('Tiếp tục buổi luyện thành công')
    resumeRun(@Req() req: IAuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.vocabPracticeService.resumeRun(req.user._id, id);
    }

    @Get('runs/active')
    @ResponseMessage('Lấy buổi luyện đang diễn ra thành công')
    getActiveRun(@Req() req: IAuthRequest) {
        return this.vocabPracticeService.getActiveRun(req.user._id);
    }

    @Patch('sessions/:id/draft')
    @ResponseMessage('Lưu nháp thành công')
    saveDraft(
        @Req() req: IAuthRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SaveDraftDto,
    ) {
        return this.vocabPracticeService.saveDraft(req.user._id, id, dto);
    }

    @Get('sessions/:id')
    @ResponseMessage('Lấy phiên luyện tập thành công')
    getSession(@Req() req: IAuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.vocabPracticeService.getSession(req.user._id, id);
    }

    @Post('sessions/:id/submit')
    @ResponseMessage('Nộp phiên luyện tập thành công')
    submitSession(
        @Req() req: IAuthRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SubmitSessionDto,
    ) {
        return this.vocabPracticeService.submitSession(req.user._id, id, dto);
    }

    @Get('sessions/:id/result')
    @ResponseMessage('Lấy kết quả phiên luyện tập thành công')
    getSessionResult(@Req() req: IAuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.vocabPracticeService.getSessionResult(req.user._id, id);
    }

    @Get('history')
    @ResponseMessage('Lấy lịch sử luyện tập thành công')
    getHistory(@Req() req: IAuthRequest) {
        return this.vocabPracticeService.getHistory(req.user._id);
    }
}
