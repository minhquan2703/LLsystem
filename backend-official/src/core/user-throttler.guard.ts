import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

//throttle theo userId khi đã đăng nhập (JwtAuthGuard chạy trước, gắn sẵn req.user) — tránh việc mọi user
//dùng chung 1 quota do request đi qua Next.js server actions nên luôn cùng 1 IP nguồn
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const userId = req.user?._id;
        return userId ? `user-${userId}` : req.ip;
    }
}
