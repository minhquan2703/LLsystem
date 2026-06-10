import { IsInt, IsIn, IsOptional, IsArray, Min, Max } from 'class-validator';

export type QuizDirection = 'zh-to-meaning' | 'meaning-to-zh';
export type QuizLanguage = 'vi' | 'en';
export type QuizWordSource = 'mine' | 'new' | 'mixed';

export class GenerateQuizDto {
    @IsIn(['zh-to-meaning', 'meaning-to-zh'])
    direction: QuizDirection;

    @IsInt()
    @Min(5)
    @Max(100)
    questionCount: number;

    @IsInt()
    @Min(2)
    @Max(6)
    optionCount: number;

    @IsIn(['vi', 'en'])
    language: QuizLanguage;

    @IsOptional()
    @IsIn(['mine', 'new', 'mixed'])
    wordSource?: QuizWordSource;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    topicIds?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(9, { each: true })
    hskLevels?: number[];
}
