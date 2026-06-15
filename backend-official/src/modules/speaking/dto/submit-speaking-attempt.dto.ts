import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class SubmitSpeakingAttemptDto {
    @IsInt()
    @Min(1)
    questionId: number;

    @IsString()
    @IsNotEmpty()
    audioBase64: string;

    @IsString()
    @Matches(/^audio\//)
    mimeType: string;

    @IsNumber()
    @Min(3)
    @Max(200)
    durationSeconds: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    pauseCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    totalPauseSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    longPauseCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    speechRatio?: number;
}
