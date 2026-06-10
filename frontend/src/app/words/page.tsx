import { getTranslations } from 'next-intl/server';
import { sendRequest } from '@/utils/api';
import WordFilter from './word.filter';
import WordCard from './word.card';
import styles from './page.module.css';

interface WordListData {
    meta: { current: number; pageSize: number; pages: number; total: number };
    results: IWord[];
}

interface Props {
    searchParams: Promise<{
        search?: string;
        hskLevel?: string;
        topicId?: string;
        current?: string;
    }>;
}

export default async function WordsPage({ searchParams }: Props) {
    const { search, hskLevel, topicId, current = '1' } = await searchParams;
    const translate = await getTranslations('words');

    const [wordsRes, topicsRes] = await Promise.all([
        sendRequest<IBackendRes<WordListData>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words`,
            method: 'GET',
            queryParams: {
                ...(search && { search }),
                ...(hskLevel && { hskLevel }),
                ...(topicId && { topicId }),
                onlyHsk: 'true',
                current,
                pageSize: '24',
            },
            nextOption: {
                next: { tags: ['list-words'], revalidate: 300 }
            },
        }),
        sendRequest<IBackendRes<ITopic[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
            method: 'GET',
            nextOption: {
                next: { tags: ['list-topics'], revalidate: 3600 }
            },
        }),
    ]);

    const wordList = wordsRes?.data?.results ?? [];
    const meta = wordsRes?.data?.meta;
    const topics = topicsRes?.data ?? [];

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{translate('page_title')}</h1>
            <p className={styles.subtitle}>
                {translate('page_subtitle', { total: meta?.total?.toLocaleString() ?? 0 })}
            </p>

            <WordFilter topics={topics} meta={meta} />

            {wordList.length === 0 ? (
                <div className={styles.empty}>{translate('no_results')}</div>
            ) : (
                <div className={styles.grid}>
                    {wordList.map((word) => (
                        <WordCard key={word.id} word={word} />
                    ))}
                </div>
            )}

            {meta && meta.total > 24 && (
                <WordFilter topics={[]} meta={meta} paginationOnly />
            )}
        </div>
    );
}
