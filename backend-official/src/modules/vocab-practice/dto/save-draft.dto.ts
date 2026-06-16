import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class DraftAttemptDto {
    @IsNumber()
    senseId: number;

    @IsArray()
    @IsString({ each: true })
    synonymsInput: string[];

    @IsString()
    @IsOptional()
    exampleInput: string;
}

export class SaveDraftDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DraftAttemptDto)
    answers: DraftAttemptDto[];

    @IsNumber()
    currentSenseIndex: number;
}
