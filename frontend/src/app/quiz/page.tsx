import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import HeaderHome from '@/components/layout/header.home';
import QuizLanding from './quiz.landing';

export default async function QuizPage() {
    const session = await auth();

    let stats: IQuizStats | undefined;
    if (session) {
        const statsRes = await sendRequest<IBackendRes<IQuizStats>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quiz/stats`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        });
        stats = statsRes?.data;
    }

    return (
        <div>
            <HeaderHome />
            <QuizLanding stats={stats} />
        </div>
    );
}
