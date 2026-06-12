import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { InactiveAccountError, InvalidEmailPasswordError } from "@/utils/errors"
import { sendRequest } from "@/utils/api"
import { IUser } from "@/types/next-auth"

// Decode phần payload của JWT để lấy thời điểm hết hạn (exp).
// JWT gồm 3 phần base64url ngăn cách bởi dấu '.': header.payload.signature
function decodeJwtExpiry(token: string): number {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    return payload.exp * 1000; // exp là Unix timestamp (giây) → chuyển sang ms
}

async function refreshAccessToken(refreshToken: string) {
    const res = await sendRequest<IBackendRes<{ access_token: string; refresh_token: string }>>({
        method: 'POST',
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/refresh`,
        body: { refresh_token: refreshToken },
    });

    if (!res.data?.access_token) {
        throw new Error('RefreshFailed');
    }

    return {
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        access_expire: decodeJwtExpiry(res.data.access_token),
    };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: {},
                password: {},
            },
            authorize: async (credentials) => {
                const res = await sendRequest<IBackendRes<ILogin>>({
                    method: "POST",
                    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
                    body: {
                        username: credentials.username,
                        password: credentials.password,
                    }
                })

                if (res.statusCode === 201) {
                    return {
                        _id: res.data?.user?._id,
                        name: res.data?.user?.name,
                        email: res.data?.user?.email,
                        role: res.data?.user?.role,
                        access_token: res.data?.access_token,
                        refresh_token: res.data?.refresh_token,
                    } as any;
                } else if (+res.statusCode === 401) {
                    throw new InvalidEmailPasswordError()
                } else if (+res.statusCode === 400) {
                    throw new InactiveAccountError()
                } else {
                    throw new Error("Internal server error")
                }
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            // Lần đầu đăng nhập: `user` được populate từ authorize()
            if (user) {
                const u = user as any;
                token.user = u as IUser;
                token.access_token = u.access_token;
                token.refresh_token = u.refresh_token;
                token.access_expire = decodeJwtExpiry(u.access_token);
                return token;
            }

            //access token còn hạn
            if (Date.now() < token.access_expire) {
                return token;
            }

            //access token hết hạn, dùng refresh token để lấy cặp token mới
            try {
                const refreshed = await refreshAccessToken(token.refresh_token);
                token.access_token = refreshed.access_token;
                token.refresh_token = refreshed.refresh_token;
                token.access_expire = refreshed.access_expire;
                // Cập nhật access_token trong user để session.user.access_token vẫn đúng
                token.user = { ...token.user, access_token: refreshed.access_token };
                token.error = undefined;
            } catch {
                //refresh thất bại (refresh token cũng hết hạn), báo client đăng nhập lại
                token.error = 'RefreshAccessTokenError';
            }

            return token;
        },
        session({ session, token }) {
            (session.user as IUser) = token.user;
            session.error = token.error;
            return session
        },
    },
})
