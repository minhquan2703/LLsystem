import { auth } from '@/auth';
import HeaderHome from '@/components/layout/header.home';
import { sendRequest } from '@/utils/api';
import { redirect } from 'next/navigation';
import SpeakingPractice from './speaking.practice';

export default async function SpeakingPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/login');
    }

    const [questionsRes, historyRes] = await Promise.all([
        sendRequest<IBackendRes<ISpeakingQuestion[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/speaking/questions`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        }),
        sendRequest<IBackendRes<ISpeakingAttempt[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/speaking/attempts`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        }),
    ]);

    return (
        <div>
            <HeaderHome />
            <SpeakingPractice
                questions={questionsRes?.data ?? []}
                history={historyRes?.data ?? []}
            />
        </div>
    );
}
