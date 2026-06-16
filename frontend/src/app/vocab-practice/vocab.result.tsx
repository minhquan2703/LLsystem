'use client'

import { useState } from 'react';
import { Card, Tag, Typography, Row, Col, Alert, Divider, Space, Button, Popconfirm } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styles from './vocab.practice.module.css';

const { Title, Text, Paragraph } = Typography;

interface Props {
    result: ISessionResultResponse;
    onNextSession: (nextSessionId: number, nextSenses: IEnglishWordSense[]) => void;
    onFinishRun: () => void;
    nextSessionId: number | null;
    nextSenses: IEnglishWordSense[] | null;
    runComplete: boolean;
    onBack?: () => void;
    onFinishEarly?: () => Promise<void>;
}

function bandColor(band: number | null): string {
    if (band === null) return 'default';
    if (band >= 7) return 'success';
    if (band >= 5) return 'warning';
    return 'error';
}

function bandLabel(band: number | null): string {
    if (band === null) return 'Chưa có';
    if (band >= 7.5) return 'Tốt';
    if (band >= 6) return 'Khá';
    if (band >= 5) return 'Trung bình';
    return 'Cần luyện thêm';
}

export default function VocabResult({ result, onNextSession, onFinishRun, nextSessionId, nextSenses, runComplete, onBack, onFinishEarly }: Props) {
    const { session, senses, attempts } = result;
    const attemptMap = new Map(attempts.map(a => [a.senseId, a]));

    const resolvedCount = attempts.filter(a => a.resolved).length;
    const pendingGrading = resolvedCount < attempts.length;
    const [isFinishingEarly, setIsFinishingEarly] = useState(false);

    return (
        <div className={styles.resultContainer}>
            <div className={styles.resultHeader}>
                <Title level={3}>Phiên {session.sessionIndex} — Kết quả</Title>
                {pendingGrading && (
                    <Alert
                        type="info"
                        icon={<ClockCircleOutlined />}
                        message="Gemini đang chấm điểm trong nền..."
                        description="Điểm chính thức và feedback chi tiết sẽ xuất hiện sau vài giây. Tải lại trang để xem."
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                {session.geminiNote && (
                    <Card className={styles.sessionNoteCard} size="small">
                        <Text italic>{session.geminiNote}</Text>
                    </Card>
                )}
            </div>

            <Row gutter={[16, 16]}>
                {senses.map(sense => {
                    const attempt = attemptMap.get(sense.id);
                    if (!attempt) return null;
                    return (
                        <Col xs={24} md={12} key={sense.id}>
                            <Card
                                size="small"
                                title={
                                    <Space>
                                        <Text strong>{sense.word?.lemma}</Text>
                                        {sense.pos && <Tag>{sense.pos}</Tag>}
                                        {sense.tier === 'academic' && <Tag color="purple">academic</Tag>}
                                    </Space>
                                }
                                className={styles.attemptCard}
                            >
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {sense.glossEn}
                                </Text>

                                <Divider style={{ margin: '10px 0' }} />

                                <Row gutter={8}>
                                    <Col span={12}>
                                        <div className={styles.attemptSection}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Synonym bạn viết</Text>
                                            <div className={styles.synonymTags} style={{ marginTop: 4 }}>
                                                {attempt.synonymsInput.length === 0 ? (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                                                ) : (
                                                    attempt.synonymsInput.map(word => (
                                                        <Tag key={word} color="geekblue">{word}</Tag>
                                                    ))
                                                )}
                                            </div>
                                            {attempt.resolved && attempt.synonymScore !== null && (
                                                <div style={{ marginTop: 6 }}>
                                                    <Tag
                                                        color={attempt.synonymScore > 0 ? 'success' : attempt.synonymScore === 0 ? 'warning' : 'error'}
                                                        icon={attempt.synonymScore > 0 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                                    >
                                                        {attempt.synonymScore > 0 ? `+${attempt.synonymScore}` : attempt.synonymScore}
                                                    </Tag>
                                                </div>
                                            )}
                                            {sense.synonyms.length > 0 && (
                                                <div style={{ marginTop: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>Đáp án:</Text>
                                                    <div className={styles.synonymTags} style={{ marginTop: 3 }}>
                                                        {sense.synonyms.map(word => (
                                                            <Tag key={word} color="default" style={{ fontSize: 11 }}>{word}</Tag>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col span={12}>
                                        <div className={styles.attemptSection}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Example</Text>
                                            {attempt.exampleInput ? (
                                                <>
                                                    <Paragraph
                                                        ellipsis={{ rows: 2, expandable: true }}
                                                        style={{ fontSize: 13, margin: '4px 0' }}
                                                    >
                                                        &ldquo;{attempt.exampleInput}&rdquo;
                                                    </Paragraph>
                                                    {attempt.resolved && attempt.exampleBand !== null ? (
                                                        <>
                                                            <Tag color={bandColor(attempt.exampleBand)}>
                                                                Band {attempt.exampleBand} — {bandLabel(attempt.exampleBand)}
                                                            </Tag>
                                                            {attempt.exampleFeedback && (
                                                                <div style={{ marginTop: 6, fontSize: 12 }}>
                                                                    <Space direction="vertical" size={2}>
                                                                        <Text
                                                                            type={attempt.exampleFeedback.isGrammaticallyCorrect ? 'success' : 'danger'}
                                                                            style={{ fontSize: 12 }}
                                                                        >
                                                                            {attempt.exampleFeedback.isGrammaticallyCorrect ? '✓ Ngữ pháp OK' : '✗ Có lỗi ngữ pháp'}
                                                                        </Text>
                                                                        <Text
                                                                            type={attempt.exampleFeedback.usesSenseCorrectly ? 'success' : 'danger'}
                                                                            style={{ fontSize: 12 }}
                                                                        >
                                                                            {attempt.exampleFeedback.usesSenseCorrectly ? '✓ Dùng đúng nghĩa' : '✗ Dùng chưa đúng nghĩa'}
                                                                        </Text>
                                                                        {attempt.exampleFeedback.improvement && (
                                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                💡 {attempt.exampleFeedback.improvement}
                                                                            </Text>
                                                                        )}
                                                                    </Space>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        !attempt.resolved && (
                                                            <Tag icon={<ClockCircleOutlined />} color="processing">
                                                                Đang chấm...
                                                            </Tag>
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>Không viết</Text>
                                                    {sense.exampleEn && (
                                                        <Paragraph
                                                            style={{ fontSize: 12, margin: '6px 0 0', color: '#888', fontStyle: 'italic' }}
                                                            ellipsis={{ rows: 3, expandable: true }}
                                                        >
                                                            Ví dụ: &ldquo;{sense.exampleEn}&rdquo;
                                                        </Paragraph>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <div className={styles.resultActions}>
                {onBack && (
                    <Button size="large" onClick={onBack}>
                        ← Quay lại
                    </Button>
                )}
                {onFinishEarly && !runComplete && (
                    <Popconfirm
                        title="Kết thúc buổi luyện?"
                        description="Các phiên còn lại sẽ bị bỏ qua."
                        okText="Kết thúc"
                        cancelText="Tiếp tục"
                        okButtonProps={{ danger: true }}
                        onConfirm={async () => {
                            setIsFinishingEarly(true);
                            await onFinishEarly();
                            setIsFinishingEarly(false);
                        }}
                    >
                        <Button size="large" danger loading={isFinishingEarly}>
                            Kết thúc sớm
                        </Button>
                    </Popconfirm>
                )}
                {runComplete ? (
                    <Button type="primary" size="large" onClick={onFinishRun}>
                        Hoàn thành buổi luyện
                    </Button>
                ) : (
                    nextSessionId && nextSenses && (
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => onNextSession(nextSessionId, nextSenses)}
                        >
                            Phiên tiếp theo →
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}
