import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { auth: session, nextUrl } = req

  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  const isAuthPage = nextUrl.pathname.startsWith('/auth')
  const isAuthApi =
    nextUrl.pathname === '/api/auth/signin' ||
    nextUrl.pathname.startsWith('/api/auth/callback/')

  if (session && (isAuthPage || isAuthApi)) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/api/auth/signin',
    '/api/auth/callback/:path*',
  ],
}
