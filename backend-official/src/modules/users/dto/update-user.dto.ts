import { IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
}
