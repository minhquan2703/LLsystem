import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAttemptDto {
    @IsInt()
    @Min(1)
    senseId: number;

    @IsArray()
    @IsString({ each: true })
    synonymsInput: string[];

    @IsOptional()
    @IsString()
    exampleInput?: string;
}

export class SubmitSessionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubmitAttemptDto)
    attempts: SubmitAttemptDto[];
}
