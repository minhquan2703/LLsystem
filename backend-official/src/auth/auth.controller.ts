import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from '@/auth/auth.service';
import { LocalAuthGuard } from '@/auth/passport/local-auth.guard';
import { JwtRefreshAuthGuard } from '@/auth/passport/jwt-refresh-auth.guard';
import { Public, ResponseMessage } from '@/decorator/customize';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { User } from '@/modules/users/entities/user.entity';

interface ILocalAuthRequest extends ExpressRequest {
    user: User
}

interface IJwtAuthRequest extends ExpressRequest {
    user: { _id: string; username: string }
}

interface IRefreshRequest extends ExpressRequest {
    user: User
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('login')
    @Public()
    @UseGuards(LocalAuthGuard)
    @ResponseMessage('Fetch login')
    handleLogin(@Request() req: ILocalAuthRequest) {
        return this.authService.login(req.user);
    }

    @Post('register')
    @Public()
    register(@Body() registerDto: CreateAuthDto) {
        return this.authService.handleRegister(registerDto);
    }

    @Post('check-code')
    @Public()
    checkCode(@Body() registerDto: CodeAuthDto) {
        return this.authService.checkCode(registerDto);
    }

    @Post('retry-active')
    @Public()
    retryActive(@Body('email') email: string) {
        return this.authService.retryActive(email);
    }

    @Post('retry-password')
    @Public()
    retryPassword(@Body('email') email: string) {
        return this.authService.retryPassword(email);
    }

    @Post('change-password')
    @Public()
    changePassword(@Body() changePasswordDto: ChangePasswordAuthDto) {
        return this.authService.changePassword(changePasswordDto);
    }

    @Post('refresh')
    @Public()
    @UseGuards(JwtRefreshAuthGuard)
    @ResponseMessage('Refresh token thành công')
    refreshTokens(@Request() req: IRefreshRequest) {
        return this.authService.refreshTokens(req.user);
    }

    @Post('logout')
    @ResponseMessage('Logout thành công')
    logout(@Request() req: IJwtAuthRequest) {
        return this.authService.logout(req.user._id);
    }

    @Get('profile')
    @ResponseMessage('Lấy thông tin người dùng thành công')
    getProfile(@Request() req: IJwtAuthRequest) {
        return this.authService.getProfile(req.user._id);
    }
}
