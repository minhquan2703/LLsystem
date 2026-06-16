import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import Link from 'next/link';
import HeaderNavClient from './header.nav.client';

export default async function HeaderHome() {
    const session = await auth();

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
        }}>
            <Link href="/" style={{ fontWeight: 600, fontSize: 18, color: '#111827', textDecoration: 'none' }}>
                LLsystem
            </Link>
            <HeaderNavClient
                isLoggedIn={!!session}
                userName={session?.user?.name ?? ''}
                userRole={session?.user?.role ?? ''}
                userId={session?.user?._id ?? ''}
                initialName={userProfile?.name ?? session?.user?.name ?? ''}
                initialLearnLang={userProfile?.learnLang ?? 'zh'}
                initialTransLang={userProfile?.transLang ?? 'vi'}
            />
        </header>
    );
}
