import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sendRequest } from '@/utils/api';
import HeaderHome from '@/components/layout/header.home';
import QuizCustomForm from './quiz.custom.form';

export default async function QuizCustomPage() {
    const session = await auth();
    if (!session) {
        redirect('/auth/login');
    }

    const topicsRes = await sendRequest<IBackendRes<ITopic[]>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
        method: 'GET',
        nextOption: {
            next: { tags: ['list-topics'], revalidate: 3600 },
        },
    });

    const topics = topicsRes?.data ?? [];

    return (
        <div>
            <HeaderHome />
            <QuizCustomForm topics={topics} />
        </div>
    );
}
