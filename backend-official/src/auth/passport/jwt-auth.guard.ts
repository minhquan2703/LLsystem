import { IS_PUBLIC_KEY } from '@/decorator/customize';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest<TUser = any>(err: Error, user: TUser): TUser {
        if (err || !user) {
            throw err || new UnauthorizedException('Access Token không hợp lệ hoặc không có tại header.');
        }
        return user;
    }
}
