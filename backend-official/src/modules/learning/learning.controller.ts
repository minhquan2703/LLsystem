import { Controller, Get, Post, Body, Req, Param, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { LearningService } from '@/modules/learning/learning.service';
import { AddWordDto } from '@/modules/learning/dto/add-word.dto';
import { ReviewDto } from '@/modules/learning/dto/review.dto';
import { ResponseMessage } from '@/decorator/customize';

interface IAuthRequest extends Request {
    user: { _id: string; username: string }
}

@Controller('learning')
export class LearningController {
    constructor(private readonly learningService: LearningService) {}

    @Get('due')
    getDueWords(@Req() req: IAuthRequest) {
        return this.learningService.getDue(req.user._id);
    }

    @Get('stats')
    getLearningStats(@Req() req: IAuthRequest) {
        return this.learningService.getStats(req.user._id);
    }

    @Post('add')
    @ResponseMessage('Đã thêm vào danh sách học')
    addWordToLearningList(@Req() req: IAuthRequest, @Body() addWordDto: AddWordDto) {
        return this.learningService.addWord(req.user._id, addWordDto);
    }

    @Post('review')
    @ResponseMessage('Đã ghi nhận kết quả')
    submitWordReview(@Req() req: IAuthRequest, @Body() reviewDto: ReviewDto) {
        return this.learningService.review(req.user._id, reviewDto);
    }

    @Post(':id/unsuspend')
    @ResponseMessage('Đã bỏ tạm dừng từ')
    unsuspendWord(@Req() req: IAuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.learningService.unsuspend(req.user._id, id);
    }
}
