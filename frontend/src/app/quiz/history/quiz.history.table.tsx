'use client'
import { Table, Tag } from 'antd';
import { useTranslations } from 'next-intl';

interface IProps {
    attempts: IQuizAttempt[];
}

const QuizHistoryTable = ({ attempts }: IProps) => {
    const translate = useTranslations('quiz');

    const directionLabel = (direction: QuizDirection) =>
        direction === 'meaning-to-zh' ? translate('dir_meaning_to_zh') : translate('dir_zh_to_meaning');

    const sourceLabel = (source: QuizWordSource) => translate(`config_word_source_${source}`);

    const columns = [
        {
            title: translate('history_date'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => new Date(value).toLocaleString(),
        },
        {
            title: translate('config_direction_label'),
            dataIndex: 'direction',
            key: 'direction',
            render: (value: QuizDirection) => directionLabel(value),
        },
        {
            title: translate('config_word_source_label'),
            dataIndex: 'wordSource',
            key: 'wordSource',
            render: (value: QuizWordSource) => <Tag>{sourceLabel(value)}</Tag>,
        },
        {
            title: translate('history_score'),
            key: 'score',
            render: (_: unknown, record: IQuizAttempt) => {
                const percent = Math.round((record.correctCount / record.questionCount) * 100);
                return `${record.correctCount}/${record.questionCount} (${percent}%)`;
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={attempts}
            rowKey="id"
            pagination={false}
            scroll={{ x: true }}
        />
    );
};

export default QuizHistoryTable;
