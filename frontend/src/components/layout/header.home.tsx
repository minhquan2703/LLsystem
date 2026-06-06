import { auth, signOut } from '@/auth';
import { Button, Space } from 'antd';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LocaleSwitcher from './locale.switcher';

export default async function HeaderHome() {
    const session = await auth();
    const translate = await getTranslations('nav');

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid #f0f0f0',
            flexWrap: 'wrap',
            gap: 8,
        }}>
            <Link href="/" style={{ fontWeight: 600, fontSize: 18, color: '#111827', textDecoration: 'none' }}>
                LLsystem
            </Link>
            <Space wrap>
                <LocaleSwitcher />
                {session ? (
                    <>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                            {translate('greeting')}, {session.user?.name}
                        </span>
                        {session.user?.role === 'ADMIN' && (
                            <Link href="/dashboard">
                                <Button size="small">{translate('dashboard')}</Button>
                            </Link>
                        )}
                        <Link href="/learn">
                            <Button size="small" type="primary">{translate('learn')}</Button>
                        </Link>
                        <form action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/' })
                        }}>
                            <Button htmlType="submit" size="small">{translate('logout')}</Button>
                        </form>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <Button size="small">{translate('login')}</Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button size="small" type="primary">{translate('register')}</Button>
                        </Link>
                    </>
                )}
            </Space>
        </header>
    )
}
