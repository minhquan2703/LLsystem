import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { QuizService } from '@/modules/quiz/quiz.service';
import { GenerateQuizDto } from '@/modules/quiz/dto/generate-quiz.dto';
import { SaveQuizAttemptDto } from '@/modules/quiz/dto/save-quiz-attempt.dto';
import { ResponseMessage } from '@/decorator/customize';
interface IAuthRequest extends Request {
    user: { _id: string; username: string }
}

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Post('generate')
    @ResponseMessage('Tạo bài quiz thành công')
    generateQuiz(@Req() req: IAuthRequest, @Body() generateQuizDto: GenerateQuizDto) {
        return this.quizService.generate(req.user._id, generateQuizDto);
    }

    @Post('attempts')
    @ResponseMessage('Lưu kết quả quiz thành công')
    saveAttempt(@Req() req: IAuthRequest, @Body() saveQuizAttemptDto: SaveQuizAttemptDto) {
        return this.quizService.saveAttempt(req.user._id, saveQuizAttemptDto);
    }

    @Get('attempts')
    @ResponseMessage('Lấy lịch sử quiz thành công')
    getHistory(@Req() req: IAuthRequest) {
        return this.quizService.getHistory(req.user._id);
    }

    @Get('stats')
    @ResponseMessage('Lấy số liệu quiz thành công')
    getStats(@Req() req: IAuthRequest) {
        return this.quizService.getStats(req.user._id);
    }
}

