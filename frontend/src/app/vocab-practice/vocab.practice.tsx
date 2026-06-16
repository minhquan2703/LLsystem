'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Select, Typography, Space, Row, Col, Tag, message, Spin } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { handleStartVocabRunAction, handleSubmitVocabSessionAction, handleFinishVocabRunEarlyAction, handleResumeRunAction } from '@/utils/actions';
import { sendRequest } from '@/utils/api';
import { useSession } from 'next-auth/react';
import VocabSession from './vocab.session';
import VocabResult from './vocab.result';
import VocabHistory from './vocab.history';
import styles from './vocab.practice.module.css';

const { Title, Text, Paragraph } = Typography;

type Phase = 'idle' | 'session' | 'result';

interface AttemptDraft {
    senseId: number;
    synonymsInput: string[];
    exampleInput: string;
}

interface Props {
    topics: string[];
    initialActiveRun: IActiveRunResponse | null;
    history: IRunHistoryItem[];
}

export default function VocabPractice({ topics, initialActiveRun, history }: Props) {
    const { data: session } = useSession();
    const router = useRouter();

    const [phase, setPhase] = useState<Phase>(initialActiveRun ? 'session' : 'idle');
    const [currentSession, setCurrentSession] = useState<IVocabSession | null>(initialActiveRun?.session ?? null);
    const [currentSenses, setCurrentSenses] = useState<IEnglishWordSense[]>(initialActiveRun?.senses ?? []);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [sessionCount, setSessionCount] = useState<number>(10);
    const [sessionResult, setSessionResult] = useState<ISessionResultResponse | null>(null);
    const [submitResponse, setSubmitResponse] = useState<ISubmitSessionResponse | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingResult, setIsLoadingResult] = useState(false);

    const fetchSessionResult = async (sessionId: number): Promise<ISessionResultResponse | null> => {
        const res = await sendRequest<IBackendRes<ISessionResultResponse>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/sessions/${sessionId}/result`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session?.user?.access_token}`,
            },
        });
        return res?.data ?? null;
    };

    const handleStartRun = async () => {
        setIsStarting(true);
        const res = await handleStartVocabRunAction({
            mode: 'topic',
            targetTopic: selectedTopic ?? undefined,
            sessionCount,
        });
        setIsStarting(false);

        if (!res?.data) {
            message.error('Không thể bắt đầu buổi luyện. Hãy thử lại.');
            return;
        }

        setCurrentSession(res.data.session);
        setCurrentSenses(res.data.senses);
        setPhase('session');
    };

    const handleSubmitSession = async (drafts: AttemptDraft[]) => {
        if (!currentSession) return;
        setIsSubmitting(true);

        const res = await handleSubmitVocabSessionAction(
            currentSession.id,
            drafts.map(d => ({
                senseId: d.senseId,
                synonymsInput: d.synonymsInput,
                exampleInput: d.exampleInput || undefined,
            })),
        );

        if (!res?.data) {
            message.error('Nộp phiên thất bại. Hãy thử lại.');
            setIsSubmitting(false);
            return;
        }

        setSubmitResponse(res.data);
        const result = await fetchSessionResult(currentSession.id);
        setIsSubmitting(false);
        if (result) {
            setSessionResult(result);
        }
        setPhase('result');
    };

    const handleNextSession = (nextSessionId: number, nextSenses: IEnglishWordSense[]) => {
        setCurrentSenses(nextSenses);
        setCurrentSession(prev =>
            prev
                ? { ...prev, id: nextSessionId, isCompleted: false, sessionIndex: prev.sessionIndex + 1, senseIds: nextSenses.map(s => s.id) }
                : null,
        );
        setSessionResult(null);
        setSubmitResponse(null);
        setPhase('session');
    };

    //auto-poll result mỗi 3 giây khi còn attempt chưa resolved
    useEffect(() => {
        if (phase !== 'result' || !sessionResult || !currentSession) return;
        const hasUnresolved = sessionResult.attempts.some(a => !a.resolved);
        if (!hasUnresolved) return;

        const timer = setTimeout(async () => {
            const result = await fetchSessionResult(currentSession.id);
            if (result) setSessionResult(result);
        }, 3000);

        return () => clearTimeout(timer);
    }, [phase, sessionResult, currentSession?.id]);

    const handleFinishRunEarly = async () => {
        await handleFinishVocabRunEarlyAction();
        handleFinishRun();
        router.refresh();
    };

    const handleFinishRun = () => {
        setCurrentSession(null);
        setCurrentSenses([]);
        setSessionResult(null);
        setSubmitResponse(null);
        setSelectedTopic(null);
        setPhase('idle');
    };

    const handleResumeRun = async (runId: number) => {
        const res = await handleResumeRunAction(runId);
        if (!res?.data && res?.error) {
            message.error('Không thể tiếp tục buổi luyện. Hãy thử lại.');
            return;
        }
        router.refresh();
    };

    const handleViewSessionResult = async (sessionId: number) => {
        setIsLoadingResult(true);
        const result = await fetchSessionResult(sessionId);
        setIsLoadingResult(false);
        if (!result) {
            message.error('Không tải được kết quả. Hãy thử lại.');
            return;
        }
        setSessionResult(result);
        setSubmitResponse(null);
        setPhase('result');
    };

    if (phase === 'session' && currentSession && currentSenses.length > 0) {
        return (
            <div className={styles.pageWrapper}>
                {isSubmitting ? (
                    <div className={styles.loadingCenter}>
                        <Spin size="large" />
                        <Text style={{ marginTop: 16 }}>Đang nộp bài...</Text>
                    </div>
                ) : (
                    <VocabSession
                        session={currentSession}
                        senses={currentSenses}
                        onSubmit={handleSubmitSession}
                        isSubmitting={isSubmitting}
                        initialDrafts={initialActiveRun?.session.draftAnswers ?? undefined}
                        initialSenseIndex={initialActiveRun?.session.currentSenseIndex ?? 0}
                    />
                )}
            </div>
        );
    }

    if (phase === 'result' && sessionResult) {
        return (
            <div className={styles.pageWrapper}>
                <VocabResult
                    result={sessionResult}
                    onNextSession={handleNextSession}
                    onFinishRun={handleFinishRun}
                    nextSessionId={submitResponse?.nextSessionId ?? null}
                    nextSenses={submitResponse?.nextSenses ?? null}
                    runComplete={submitResponse?.runComplete ?? false}
                    onBack={submitResponse ? undefined : () => setPhase('idle')}
                    onFinishEarly={submitResponse && !submitResponse.runComplete ? handleFinishRunEarly : undefined}
                />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.heroSection}>
                <BookOutlined className={styles.heroIcon} />
                <Title level={2} className={styles.heroTitle}>
                    Vocab Practice
                </Title>
                <Paragraph type="secondary" className={styles.heroSubtitle}>
                    Luyện từ vựng IELTS theo phiên — synonym + câu ví dụ, Gemini chấm điểm.
                </Paragraph>
            </div>

            <Card className={styles.startCard}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Row gutter={[16, 16]} align="bottom">
                        <Col xs={24} md={12}>
                            <Text strong style={{ display: 'block', marginBottom: 6 }}>
                                Topic
                            </Text>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Ngẫu nhiên"
                                allowClear
                                value={selectedTopic}
                                onChange={value => setSelectedTopic(value)}
                                options={topics.map(t => ({
                                    value: t,
                                    label: <span style={{ textTransform: 'capitalize' }}>{t}</span>,
                                }))}
                            />
                            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                                Để trống = chọn ngẫu nhiên
                            </Text>
                        </Col>

                        <Col xs={24} md={12}>
                            <Text strong style={{ display: 'block', marginBottom: 6 }}>
                                Số phiên
                            </Text>
                            <Select
                                style={{ width: '100%' }}
                                value={sessionCount}
                                onChange={value => setSessionCount(value)}
                                options={[
                                    { value: 5, label: '5 phiên (~20 từ)' },
                                    { value: 10, label: '10 phiên (~40 từ)' },
                                    { value: 15, label: '15 phiên (~60 từ)' },
                                ]}
                            />
                        </Col>
                    </Row>

                    <div className={styles.topicTagList}>
                        {topics.slice(0, 8).map(topic => (
                            <Tag
                                key={topic}
                                color={selectedTopic === topic ? 'blue' : 'default'}
                                style={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                            >
                                {topic}
                            </Tag>
                        ))}
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        block
                        loading={isStarting}
                        onClick={handleStartRun}
                        disabled={topics.length === 0}
                    >
                        Bắt đầu luyện tập
                    </Button>
                </Space>
            </Card>

            {isLoadingResult && (
                <div className={styles.loadingCenter} style={{ minHeight: 120 }}>
                    <Spin />
                    <Text style={{ marginTop: 12 }}>Đang tải kết quả...</Text>
                </div>
            )}

            <VocabHistory
                history={history}
                onViewSessionResult={handleViewSessionResult}
                onResumeRun={handleResumeRun}
                isLoading={isLoadingResult}
                hasActiveRun={!!initialActiveRun}
            />
        </div>
    );
}
