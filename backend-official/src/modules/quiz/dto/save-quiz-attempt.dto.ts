import { IsInt, IsIn, IsArray, IsOptional, Min, Max } from 'class-validator';
import { QuizDirection, QuizLanguage, QuizWordSource } from '@/modules/quiz/dto/generate-quiz.dto';

export class SaveQuizAttemptDto {
    @IsIn(['zh-to-meaning', 'meaning-to-zh'])
    direction: QuizDirection;

    @IsIn(['vi', 'en'])
    language: QuizLanguage;

    @IsIn(['mine', 'new', 'mixed'])
    wordSource: QuizWordSource;

    @IsInt()
    @Min(1)
    questionCount: number;

    @IsInt()
    @Min(2)
    @Max(6)
    optionCount: number;

    @IsInt()
    @Min(0)
    correctCount: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    wrongWordIds?: number[];
}
