import { auth } from '@/auth';
import HeaderHome from '@/components/layout/header.home';
import HomePage from '@/components/layout/homepage';
import UserDashboard from '@/components/layout/user.dashboard';

export default async function Home() {
    const session = await auth();

    return (
        <div>
            <HeaderHome />
            {session ? (
                <UserDashboard isAdmin={session.user?.role === 'ADMIN'} />
            ) : (
                <HomePage />
            )}
        </div>
    )
}
