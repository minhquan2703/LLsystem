import { auth } from '@/auth';
import HeaderHome from '@/components/layout/header.home';
import { sendRequest } from '@/utils/api';
import { redirect } from 'next/navigation';
import VocabPractice from './vocab.practice';

export default async function VocabPracticePage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/login');
    }

    const [topicsRes, activeRunRes, historyRes] = await Promise.all([
        sendRequest<IBackendRes<string[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/english-words/topics`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
            nextOption: { next: { tags: ['english-topics'] } },
        }),
        sendRequest<IBackendRes<IActiveRunResponse | null>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/runs/active`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        }),
        sendRequest<IBackendRes<IRunHistoryItem[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/history`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
            nextOption: { next: { tags: ['vocab-history'] } },
        }),
    ]);

    return (
        <div>
            <HeaderHome />
            <VocabPractice
                topics={topicsRes?.data ?? []}
                initialActiveRun={activeRunRes?.data ?? null}
                history={historyRes?.data ?? []}
            />
        </div>
    );
}
