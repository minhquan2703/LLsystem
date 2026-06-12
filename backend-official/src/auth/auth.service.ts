import { Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper, hashPasswordHelper } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    validateUser = async (username: string, password: string): Promise<User | null> => {
        const user = await this.usersService.findByEmail(username);
        if (!user) {
            return null;
        }
        const isValidPassword = await comparePasswordHelper(password, user.password);
        if (!isValidPassword) {
            return null;
        }
        return user;
    }

    login = async (user: User) => {
        const payload = { username: user.email, sub: user.id };
        const accessToken = this.jwtService.sign(payload);
        //dự án đang ở giai đoạn phát triển — refresh token 5 ngày để không phải login lại thường xuyên
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
        });
        const hashedRefreshToken = await hashPasswordHelper(refreshToken);
        await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);
        return {
            user: {
                email: user.email,
                _id: user.id,
                name: user.name,
                role: user.role,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    refreshTokens = async (user: User) => {
        const payload = { username: user.email, sub: user.id };
        const accessToken = this.jwtService.sign(payload);
        //dự án đang ở giai đoạn phát triển — refresh token 5 ngày để không phải login lại thường xuyên
        const newRefreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
        });
        const hashedRefreshToken = await hashPasswordHelper(newRefreshToken);
        await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);
        return {
            access_token: accessToken,
            refresh_token: newRefreshToken,
        };
    }

    logout = async (userId: string) => {
        await this.usersService.updateRefreshToken(userId, null);
    }

    handleRegister = async (registerDto: CreateAuthDto) => {
        return await this.usersService.handleRegister(registerDto);
    }

    checkCode = async (data: CodeAuthDto) => {
        return await this.usersService.handleActive(data);
    }

    retryActive = async (data: string) => {
        return await this.usersService.retryActive(data);
    }

    retryPassword = async (data: string) => {
        return await this.usersService.retryPassword(data);
    }

    changePassword = async (data: ChangePasswordAuthDto) => {
        return await this.usersService.changePassword(data);
    }

    getProfile = async (id: string) => {
        return await this.usersService.findOne(id);
    }
}
