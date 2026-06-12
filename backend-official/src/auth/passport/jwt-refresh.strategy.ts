import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    validate = async (req: Request, payload: any) => {
        const refreshToken = (req.body as { refresh_token: string }).refresh_token;
        if (!refreshToken) {
            throw new UnauthorizedException();
        }
        return this.usersService.validateRefreshToken(payload.sub, refreshToken);
    }
}
