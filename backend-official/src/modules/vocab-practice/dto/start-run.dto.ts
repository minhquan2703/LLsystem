import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PracticeMode } from '../entities/vocab-practice-run.entity';

export class StartRunDto {
    @IsOptional()
    @IsEnum(['topic', 'context'])
    mode?: PracticeMode;

    @IsOptional()
    @IsString()
    targetTopic?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(30)
    sessionCount?: number;
}
