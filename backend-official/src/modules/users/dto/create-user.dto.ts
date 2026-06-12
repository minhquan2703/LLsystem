import { IsEmail, IsIn, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @IsEmail({}, { message: "email không hợp lệ" })
    email: string;

    @IsNotEmpty()
    @MinLength(6, { message: "password phải có ít nhất 6 ký tự" })
    password: string;

    @IsOptional()
    phone: string;

    @IsOptional()
    address: string;

    @IsOptional()
    image: string;

    @IsNotEmpty()
    @IsIn(['USER', 'ADMIN'])
    role: string;
}