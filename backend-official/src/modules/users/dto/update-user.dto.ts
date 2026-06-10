import { IsIn, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateUserDto {
  @IsUUID('4', { message: 'id không hợp lệ' })
  @IsNotEmpty({ message: 'id không được để trống' })
  id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  address: string;

  @IsOptional()
  image: string;

  @IsOptional()
  @IsIn(['zh', 'en'], { message: 'learnLang phải là zh hoặc en' })
  learnLang: string;

  @IsOptional()
  @IsIn(['vi', 'en', 'zh'], { message: 'transLang phải là vi, en hoặc zh' })
  transLang: string;

  @IsOptional()
  @IsInt({ message: 'hskLevel phải là số nguyên' })
  @Min(1, { message: 'hskLevel tối thiểu là 1' })
  @Max(9, { message: 'hskLevel tối đa là 9' })
  hskLevel: number;
}
