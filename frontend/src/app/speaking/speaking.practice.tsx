'use client';
import { useState } from 'react';
import { Button, Card, Col, Empty, List, message, Popconfirm, Row, Segmented, Tag } from 'antd';
import { AudioOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { handleDeleteSpeakingAttemptAction } from '@/utils/actions';
import SpeakingRecorder from './speaking.recorder';
import { bandColor } from './speaking.result';
import styles from './page.module.css';

interface Props {
    questions: ISpeakingQuestion[];
    history: ISpeakingAttempt[];
}

export default function SpeakingPractice({ questions, history }: Props) {
    const [part, setPart] = useState<SpeakingPart>(1);
    const [currentQuestion, setCurrentQuestion] = useState<ISpeakingQuestion | null>(null);
    const [historyList, setHistoryList] = useState<ISpeakingAttempt[]>(history);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const translate = useTranslations('speaking');

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        const res = await handleDeleteSpeakingAttemptAction(id);
        if (res?.data) {
            setHistoryList((previous) => previous.filter((attempt) => attempt.id !== id));
            message.success(translate('delete_success'));
        } else {
            message.error(translate('delete_failed'));
        }
        setDeletingId(null);
    };

    if (currentQuestion) {
        return (
            <SpeakingRecorder
                question={currentQuestion}
                onBack={() => setCurrentQuestion(null)}
            />
        );
    }

    const questionsOfPart = questions.filter((question) => question.part === part);
    const topics = Array.from(new Set(questionsOfPart.map((question) => question.topic)));

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{translate('title')}</h1>
            <p className={styles.subtitle}>{translate('subtitle')}</p>

            <Segmented
                block
                size="large"
                value={part}
                onChange={(value) => setPart(value as SpeakingPart)}
                options={[
                    { label: translate('part1'), value: 1 },
                    { label: translate('part2'), value: 2 },
                    { label: translate('part3'), value: 3 },
                ]}
                style={{ marginBottom: 24 }}
            />

            {questionsOfPart.length === 0 && <Empty description={translate('no_questions')} />}

            {topics.map((topic) => (
                <div key={topic} style={{ marginBottom: 20 }}>
                    <h3 className={styles.topicHeading}>{topic}</h3>
                    <Row gutter={[12, 12]}>
                        {questionsOfPart
                            .filter((question) => question.topic === topic)
                            .map((question) => (
                                <Col xs={24} md={12} key={question.id}>
                                    <Card
                                        hoverable
                                        size="small"
                                        onClick={() => setCurrentQuestion(question)}
                                    >
                                        <AudioOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                                        {question.questionText}
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                </div>
            ))}

            {historyList.length > 0 && (
                <Card title={translate('recent_attempts')} size="small" style={{ marginTop: 32 }}>
                    <List
                        dataSource={historyList.slice(0, 10)}
                        renderItem={(historyAttempt) => (
                            <List.Item>
                                <div className={styles.historyRow}>
                                    <Tag color="blue">Part {historyAttempt.question?.part}</Tag>
                                    <span className={styles.historyQuestion}>
                                        {historyAttempt.question?.questionText}
                                    </span>
                                    <Tag color={bandColor(historyAttempt.bandOverall)}>
                                        {historyAttempt.bandOverall.toFixed(1)}
                                    </Tag>
                                    <span className={styles.historyDate}>
                                        {new Date(historyAttempt.createdAt).toLocaleDateString()}
                                    </span>
                                    {historyAttempt.audioUrl && (
                                        <audio
                                            controls
                                            preload="none"
                                            src={historyAttempt.audioUrl}
                                            className={styles.historyAudio}
                                        />
                                    )}
                                    <Popconfirm
                                        title={translate('delete_confirm')}
                                        okText={translate('delete_ok')}
                                        cancelText={translate('delete_cancel')}
                                        onConfirm={() => handleDelete(historyAttempt.id)}
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            loading={deletingId === historyAttempt.id}
                                        />
                                    </Popconfirm>
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </div>
    );
}
