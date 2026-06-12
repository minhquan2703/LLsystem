import { Module } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { UsersModule } from '@/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { JwtRefreshStrategy } from '@/auth/passport/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule
  ],

  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule { }
