import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @IsNotEmpty({ message: 'name không được để trống' })
  name: string;

  @IsOptional()
  nameVi: string;

  @IsOptional()
  description: string;
}
