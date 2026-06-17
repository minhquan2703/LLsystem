'use client';
import { useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Select, Tag } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { bandColor } from './speaking.result';
import styles from './page.module.css';

interface Props {
    history: ISpeakingAttempt[];
}

interface QuestionGroup {
    questionId: number;
    question: ISpeakingQuestion;
    attempts: ISpeakingAttempt[];
}

export default function SpeakingCompare({ history }: Props) {
    const translate = useTranslations('speaking');

    //gom các lần làm theo câu hỏi, chỉ giữ câu có từ 2 lần trở lên, sắp theo thời gian tăng dần
    const questionGroups = useMemo<QuestionGroup[]>(() => {
        const map = new Map<number, ISpeakingAttempt[]>();
        for (const attempt of history) {
            const list = map.get(attempt.questionId) ?? [];
            list.push(attempt);
            map.set(attempt.questionId, list);
        }
        return Array.from(map.entries())
            .filter(([, list]) => list.length >= 2)
            .map(([questionId, list]) => ({
                questionId,
                question: list[0].question,
                attempts: [...list].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                ),
            }));
    }, [history]);

    const initialGroup = questionGroups[0] ?? null;
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(initialGroup?.questionId ?? null);
    const [leftId, setLeftId] = useState<number | null>(initialGroup?.attempts[0]?.id ?? null);
    const [rightId, setRightId] = useState<number | null>(
        initialGroup ? initialGroup.attempts[initialGroup.attempts.length - 1].id : null,
    );

    if (questionGroups.length === 0) {
        return <Empty description={translate('compare_empty')} style={{ marginTop: 32 }} />;
    }

    const selectedGroup = questionGroups.find((group) => group.questionId === selectedQuestionId) ?? questionGroups[0];
    const leftAttempt = selectedGroup.attempts.find((attempt) => attempt.id === leftId) ?? selectedGroup.attempts[0];
    const rightAttempt =
        selectedGroup.attempts.find((attempt) => attempt.id === rightId) ??
        selectedGroup.attempts[selectedGroup.attempts.length - 1];

    const handleQuestionChange = (questionId: number) => {
        const group = questionGroups.find((item) => item.questionId === questionId);
        if (!group) {
            return;
        }
        setSelectedQuestionId(questionId);
        setLeftId(group.attempts[0].id);
        setRightId(group.attempts[group.attempts.length - 1].id);
    };

    const attemptOptions = selectedGroup.attempts.map((attempt, index) => ({
        value: attempt.id,
        label: `#${index + 1} · ${new Date(attempt.createdAt).toLocaleDateString()} · ${attempt.bandOverall.toFixed(1)}`,
    }));

    const criteria = [
        { key: 'overall', label: translate('result_overall'), left: leftAttempt.bandOverall, right: rightAttempt.bandOverall },
        { key: 'fluency', label: translate('result_fluency'), left: leftAttempt.bandFluency, right: rightAttempt.bandFluency },
        { key: 'lexical', label: translate('result_lexical'), left: leftAttempt.bandLexical, right: rightAttempt.bandLexical },
        { key: 'grammar', label: translate('result_grammar'), left: leftAttempt.bandGrammar, right: rightAttempt.bandGrammar },
        { key: 'pronunciation', label: translate('result_pronunciation'), left: leftAttempt.bandPronunciation, right: rightAttempt.bandPronunciation },
    ];

    return (
        <Card title={translate('compare_title')} size="small" style={{ marginTop: 16 }}>
            <Select
                value={selectedGroup.questionId}
                onChange={handleQuestionChange}
                style={{ width: '100%', marginBottom: 16 }}
                options={questionGroups.map((group) => ({
                    value: group.questionId,
                    label: `Part ${group.question?.part} · ${group.question?.questionText}`,
                }))}
            />

            <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
                <Col xs={24} md={12}>
                    <div className={styles.compareColLabel}>{translate('compare_earlier')}</div>
                    <Select
                        value={leftAttempt.id}
                        onChange={setLeftId}
                        style={{ width: '100%' }}
                        options={attemptOptions}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <div className={styles.compareColLabel}>{translate('compare_later')}</div>
                    <Select
                        value={rightAttempt.id}
                        onChange={setRightId}
                        style={{ width: '100%' }}
                        options={attemptOptions}
                    />
                </Col>
            </Row>

            {criteria.map((criterion) => {
                //delta dương = tiến bộ (xanh), âm = tụt (đỏ), 0 = giữ nguyên
                const delta = Math.round((criterion.right - criterion.left) * 10) / 10;
                return (
                    <Row key={criterion.key} className={styles.compareRow} align="middle" gutter={[8, 4]}>
                        <Col xs={24} md={8}>
                            <span className={styles.compareLabel}>{criterion.label}</span>
                        </Col>
                        <Col xs={8} md={5}>
                            <Tag color={bandColor(criterion.left)}>{criterion.left.toFixed(1)}</Tag>
                        </Col>
                        <Col xs={8} md={6} style={{ textAlign: 'center' }}>
                            {delta === 0 ? (
                                <span className={styles.compareNeutral}>—</span>
                            ) : (
                                <span style={{ color: delta > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                    {delta > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta).toFixed(1)}
                                </span>
                            )}
                        </Col>
                        <Col xs={8} md={5}>
                            <Tag color={bandColor(criterion.right)}>{criterion.right.toFixed(1)}</Tag>
                        </Col>
                    </Row>
                );
            })}

            <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                    <Card size="small" title={new Date(leftAttempt.createdAt).toLocaleDateString()}>
                        <p className={styles.compareTranscript}>{leftAttempt.transcript}</p>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card size="small" title={new Date(rightAttempt.createdAt).toLocaleDateString()}>
                        <p className={styles.compareTranscript}>{rightAttempt.transcript}</p>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
}
