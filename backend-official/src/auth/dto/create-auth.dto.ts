import { IsEmail, IsNotEmpty, IsOptional, MinLength } from "class-validator";

export class CreateAuthDto {

    @IsNotEmpty({ message: "email không được để trống" })
    @IsEmail({}, { message: "email không hợp lệ" })
    email: string;

    @IsNotEmpty({ message: "password không được để trống" })
    @MinLength(6, { message: "password phải có ít nhất 6 ký tự" })
    password: string;

    @IsOptional()
    name: string;
}

export class CodeAuthDto {

    @IsNotEmpty({ message: "_id không được để trống" })
    _id: string;

    @IsNotEmpty({ message: "code không được để trống" })
    code: string;

}


export class ChangePasswordAuthDto {
    @IsNotEmpty({ message: "code không được để trống" })
    code: string;

    @IsNotEmpty({ message: "password không được để trống" })
    @MinLength(6, { message: "password phải có ít nhất 6 ký tự" })
    password: string;

    @IsNotEmpty({ message: "confirmPassword không được để trống" })
    @MinLength(6, { message: "confirmPassword phải có ít nhất 6 ký tự" })
    confirmPassword: string;

    @IsNotEmpty({ message: "email không được để trống" })
    @IsEmail({}, { message: "email không hợp lệ" })
    email: string;

}
