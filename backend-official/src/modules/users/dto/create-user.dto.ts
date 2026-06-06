import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
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