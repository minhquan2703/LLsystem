import { IsInt, IsPositive } from 'class-validator';

export class AddWordDto {
    @IsInt()
    @IsPositive()
    wordId: number;
}
