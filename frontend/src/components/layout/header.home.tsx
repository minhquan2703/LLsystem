import { auth, signOut } from '@/auth';
import { sendRequest } from '@/utils/api';
import { Button, Space } from 'antd';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import AccountSettings from './account.settings';
import LocaleSwitcher from './locale.switcher';

export default async function HeaderHome() {
    const session = await auth();
    const translate = await getTranslations('nav');

    let userProfile: IUser | null = null;
    if (session?.user?._id) {
        const res = await sendRequest<IBackendRes<IUser>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${session.user._id}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user.access_token}`,
            },
            nextOption: {
                next: { tags: ['user-profile'] },
            },
        });
        userProfile = res?.data ?? null;
    }

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
                        <AccountSettings
                            userId={session.user._id}
                            initialName={userProfile?.name ?? session.user.name ?? ''}
                            initialLearnLang={userProfile?.learnLang ?? 'zh'}
                            initialTransLang={userProfile?.transLang ?? 'vi'}
                        />
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
