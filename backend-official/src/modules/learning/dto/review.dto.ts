import { IsInt, IsIn } from 'class-validator';

export class ReviewDto {
    @IsInt()
    userWordId: number;

    @IsInt()
    @IsIn([0, 1, 2, 3, 4, 5])
    quality: number;
}
