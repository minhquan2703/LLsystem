import { IsArray, IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class CreateWordDto {
  @IsNotEmpty({ message: 'simplified không được để trống' })
  simplified: string;

  @IsOptional()
  traditional: string;

  @IsOptional()
  pinyin: string;

  @IsOptional()
  hanViet: string;

  @IsOptional()
  englishDef: string;

  @IsOptional()
  vietnameseDef: string;

  @IsOptional()
  @IsInt({ message: 'hskLevel phải là số nguyên' })
  @Min(1, { message: 'hskLevel tối thiểu là 1' })
  @Max(9, { message: 'hskLevel tối đa là 9' })
  hskLevel: number;

  @IsOptional()
  partOfSpeech: string;

  @IsOptional()
  @IsInt({ message: 'frequency phải là số nguyên' })
  frequency: number;

  @IsOptional()
  @IsArray({ message: 'topicIds phải là mảng' })
  topicIds: number[];
}
