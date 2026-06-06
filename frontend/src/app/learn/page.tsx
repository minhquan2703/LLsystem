import { auth } from '@/auth';
import Flashcard from '@/components/layout/flashcard';
import HeaderHome from '@/components/layout/header.home';
import { sendRequest } from '@/utils/api';
import { redirect } from 'next/navigation';

export default async function LearnPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/login');
    }

    const res = await sendRequest<IBackendRes<ILearningDue>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/due`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${session.user?.access_token}`,
        },
    })

    const dueWords = res?.data?.words ?? [];

    return (
        <div>
            <HeaderHome />
            <Flashcard words={dueWords} />
        </div>
    )
}
