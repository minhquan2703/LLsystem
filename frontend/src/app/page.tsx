import { auth } from '@/auth'
import HeaderHome from '@/components/layout/header.home'
import HomePage from '@/components/layout/homepage'

export default async function Home() {
    const session = await auth()

    return (
        <div>
            <HeaderHome />
            <HomePage
                isLoggedIn={!!session}
                isAdmin={session?.user?.role === 'ADMIN'}
            />
        </div>
    )
}