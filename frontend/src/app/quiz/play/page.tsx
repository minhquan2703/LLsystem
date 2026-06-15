import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { sendRequest } from '@/utils/api';
import HeaderHome from '@/components/layout/header.home';
import QuizRunner from '@/app/quiz/quiz.runner';

interface Props {
    searchParams: Promise<{
        direction?: string;
        count?: string;
        options?: string;
        source?: string;
        topics?: string;
        hskLevels?: string;
        timer?: string;
        practice?: string;
    }>;
}

const parseIdList = (value: string | undefined): number[] | undefined => {
    if (!value) {
        return undefined;
    }
    const ids = value
        .split(',')
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0);
    return ids.length > 0 ? ids : undefined;
};

export default async function QuizPlayPage({ searchParams }: Props) {
    const { direction, count, options, source, topics, hskLevels, timer, practice } = await searchParams;
    const session = await auth();
    if (!session) {
        redirect('/auth/login');
    }

    const locale = await getLocale();
    //ngôn ngữ nghĩa bám theo locale: vi dùng nghĩa Việt, còn lại dùng nghĩa Anh
    const language = locale === 'vi' ? 'vi' : 'en';
    const quizDirection: QuizDirection = direction === 'meaning-to-zh' ? 'meaning-to-zh' : 'zh-to-meaning';
    const questionCount = Math.min(100, Math.max(5, Number(count) || 10));
    const optionCount = Math.min(6, Math.max(2, Number(options) || 4));
    const wordSource: QuizWordSource = source === 'mine' || source === 'new' ? source : 'mixed';
    const topicIds = parseIdList(topics);
    const hskLevelList = parseIdList(hskLevels);
    const timerSeconds = timer === 'off' ? null : Number(timer) || null;
    const practiceMode = practice === '1';

    const res = await sendRequest<IBackendRes<IQuizGenerateResult>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quiz/generate`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.user?.access_token}`,
        },
        body: {
            direction: quizDirection,
            questionCount,
            optionCount,
            language,
            wordSource,
            ...(topicIds && { topicIds }),
            ...(hskLevelList && { hskLevels: hskLevelList }),
        },
    });

    const questions = res?.data?.questions ?? [];

    return (
        <div>
            <HeaderHome />
            <QuizRunner
                questions={questions}
                direction={quizDirection}
                timerSeconds={timerSeconds}
                attemptConfig={{ language, wordSource, optionCount }}
                practiceMode={practiceMode}
            />
        </div>
    );
}
