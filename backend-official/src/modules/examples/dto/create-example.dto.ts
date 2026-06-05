import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateExampleDto {
  @IsNotEmpty({ message: 'chinese không được để trống' })
  chinese: string;

  @IsOptional()
  pinyin: string;

  @IsOptional()
  english: string;

  @IsOptional()
  vietnamese: string;

  @IsNotEmpty({ message: 'wordId không được để trống' })
  @IsInt({ message: 'wordId phải là số' })
  wordId: number;
}
