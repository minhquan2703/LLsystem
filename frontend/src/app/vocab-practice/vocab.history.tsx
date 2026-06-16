'use client'

import { useState } from 'react';
import { Card, Collapse, Tag, Typography, Space, Button, Spin } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, BookOutlined } from '@ant-design/icons';
import styles from './vocab.practice.module.css';

const { Text, Title } = Typography;

interface Props {
    history: IRunHistoryItem[];
    onViewSessionResult: (sessionId: number) => Promise<void>;
    onResumeRun: (runId: number) => Promise<void>;
    isLoading: boolean;
    hasActiveRun: boolean;
}

function topicColor(topic: string): string {
    const colors: Record<string, string> = {
        education: 'blue',
        environment: 'green',
        technology: 'purple',
        health: 'orange',
    };
    return colors[topic] ?? 'default';
}

export default function VocabHistory({ history, onViewSessionResult, onResumeRun, isLoading, hasActiveRun }: Props) {
    const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);
    const [resumingRunId, setResumingRunId] = useState<number | null>(null);

    const handleResume = async (runId: number) => {
        setResumingRunId(runId);
        await onResumeRun(runId);
        setResumingRunId(null);
    };

    const handleView = async (sessionId: number) => {
        setLoadingSessionId(sessionId);
        await onViewSessionResult(sessionId);
        setLoadingSessionId(null);
    };

    if (history.length === 0) {
        return null;
    }

    const items = history.map(item => ({
        key: String(item.run.id),
        label: (
            <Space wrap onClick={e => e.stopPropagation()}>
                <Tag color={topicColor(item.run.targetTopic ?? '')} style={{ textTransform: 'capitalize' }}>
                    {item.run.targetTopic ?? 'random'}
                </Tag>
                <Text>
                    {item.run.completedSessions}/{item.run.sessionCount} phiên
                </Text>
                {item.run.completedAt ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>
                ) : (
                    <Tag color="processing" icon={<ClockCircleOutlined />}>Đang dở</Tag>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.run.createdAt).toLocaleDateString('vi-VN')}
                </Text>
                {item.hasResumableSessions && (
                    <Button
                        size="small"
                        type="primary"
                        loading={resumingRunId === item.run.id}
                        disabled={hasActiveRun}
                        title={hasActiveRun ? 'Hoàn thành run hiện tại trước' : undefined}
                        onClick={e => { e.stopPropagation(); handleResume(item.run.id); }}
                    >
                        Tiếp tục
                    </Button>
                )}
            </Space>
        ),
        children: item.sessions.length === 0 ? (
            <Text type="secondary">Chưa có phiên nào hoàn thành.</Text>
        ) : (
            <div className={styles.historySessionList}>
                {item.sessions.map(session => (
                    <div key={session.id} className={styles.historySessionRow}>
                        <Space>
                            <Text>Phiên {session.sessionIndex}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {session.completedAt
                                    ? new Date(session.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                            </Text>
                            {session.geminiNote ? (
                                <Tag color="success">Đã chấm</Tag>
                            ) : (
                                <Tag color="processing">Chờ chấm</Tag>
                            )}
                        </Space>
                        <Button
                            size="small"
                            type="link"
                            loading={loadingSessionId === session.id}
                            onClick={() => handleView(session.id)}
                        >
                            Xem kết quả
                        </Button>
                    </div>
                ))}
            </div>
        ),
    }));

    return (
        <div className={styles.historySection}>
            <Title level={5} style={{ marginBottom: 12 }}>
                <BookOutlined style={{ marginRight: 6 }} />
                Lịch sử luyện tập
            </Title>
            <Collapse
                size="small"
                items={items}
                className={styles.historyCollapse}
            />
        </div>
    );
}
