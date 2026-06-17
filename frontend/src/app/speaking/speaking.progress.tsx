'use client';
import { Card, Empty } from 'antd';
import { useTranslations } from 'next-intl';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
    progress: ISpeakingProgressPoint[];
}

export default function SpeakingProgress({ progress }: Props) {
    const translate = useTranslations('speaking');

    if (progress.length === 0) {
        return <Empty description={translate('progress_empty')} style={{ marginTop: 32 }} />;
    }

    const chartData = progress.map((point) => ({
        week: point.weekStart.slice(5),
        overall: point.avgOverall,
        fluency: point.avgFluency,
        lexical: point.avgLexical,
        grammar: point.avgGrammar,
        pronunciation: point.avgPronunciation,
    }));

    const lines = [
        { key: 'overall', name: translate('result_overall'), color: '#1677ff', width: 3 },
        { key: 'fluency', name: translate('result_fluency'), color: '#16a34a', width: 1.5 },
        { key: 'lexical', name: translate('result_lexical'), color: '#d97706', width: 1.5 },
        { key: 'grammar', name: translate('result_grammar'), color: '#9333ea', width: 1.5 },
        { key: 'pronunciation', name: translate('result_pronunciation'), color: '#dc2626', width: 1.5 },
    ];

    return (
        <Card title={translate('progress_title')} size="small" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} />
                    <Tooltip />
                    <Legend />
                    {lines.map((line) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={line.width}
                            dot={{ r: 3 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
