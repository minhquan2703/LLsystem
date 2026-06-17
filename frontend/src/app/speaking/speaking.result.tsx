'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Collapse, List, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import { RedoOutlined, UnorderedListOutlined, CheckCircleOutlined, RiseOutlined, SoundOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { handleGetSpeakingAttemptAction } from '@/utils/actions';
import styles from './page.module.css';

export function bandColor(band: number): string {
    if (band >= 7) {
        return '#16a34a';
    }
    if (band >= 6) {
        return '#1677ff';
    }
    if (band >= 5) {
        return '#d97706';
    }
    return '#dc2626';
}

interface Props {
    attempt: ISpeakingAttempt;
    onRetry: () => void;
    onBack: () => void;
}

export default function SpeakingResult({ attempt, onRetry, onBack }: Props) {
    const translate = useTranslations('speaking');
    const { feedback, metrics } = attempt;
    const [liveAttempt, setLiveAttempt] = useState(attempt);
    const pollCountRef = useRef(0);

    //poll mỗi 3s tối đa 20 lần (60s) cho đến khi prosodyStatus = done | failed
    useEffect(() => {
        if (liveAttempt.prosodyStatus === 'done' || liveAttempt.prosodyStatus === 'failed') {
            return;
        }
        pollCountRef.current = 0;
        const intervalId = setInterval(async () => {
            pollCountRef.current += 1;
            if (pollCountRef.current >= 20) {
                clearInterval(intervalId);
                return;
            }
            const res = await handleGetSpeakingAttemptAction(liveAttempt.id);
            if (res?.data) {
                setLiveAttempt(res.data);
            }
        }, 3000);
        return () => clearInterval(intervalId);
    }, [liveAttempt.prosodyStatus, liveAttempt.id]);

    const criteria = [
        { title: translate('result_fluency'), value: attempt.bandFluency },
        { title: translate('result_lexical'), value: attempt.bandLexical },
        { title: translate('result_grammar'), value: attempt.bandGrammar },
        { title: translate('result_pronunciation'), value: attempt.bandPronunciation },
    ];

    return (
        <div>
            <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                    <Card className={styles.overallCard}>
                        <Statistic
                            title={translate('result_overall')}
                            value={attempt.bandOverall}
                            precision={1}
                            valueStyle={{ fontSize: 44, fontWeight: 700, color: bandColor(attempt.bandOverall) }}
                        />
                    </Card>
                </Col>
                {criteria.map((criterion) => (
                    <Col xs={12} md={4} key={criterion.title}>
                        <Card>
                            <Statistic
                                title={criterion.title}
                                value={criterion.value}
                                precision={1}
                                valueStyle={{ fontSize: 24, color: bandColor(criterion.value) }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card title={translate('metrics_title')} size="small" style={{ marginTop: 12 }}>
                <Row gutter={[12, 12]}>
                    <Col xs={12} md={5}>
                        <Statistic title={translate('metric_wpm')} value={metrics.wordsPerMinute} />
                    </Col>
                    <Col xs={12} md={5}>
                        <Statistic title={translate('metric_words')} value={metrics.wordCount} />
                    </Col>
                    <Col xs={12} md={5}>
                        <Statistic
                            title={translate('metric_pauses')}
                            value={metrics.pauseCount}
                            suffix={<span className={styles.metricSuffix}>{translate('metric_pause_seconds', { seconds: metrics.totalPauseSeconds })}</span>}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Statistic title={translate('metric_long_pauses')} value={metrics.longPauseCount} />
                    </Col>
                    <Col xs={12} md={5}>
                        <Statistic title={translate('metric_fillers')} value={metrics.fillerWordCount} />
                    </Col>
                </Row>
            </Card>

            <Card title={translate('transcript_title')} size="small" style={{ marginTop: 12 }}>
                {attempt.audioUrl && (
                    <audio controls src={attempt.audioUrl} className={styles.audioPlayer} style={{ marginBottom: 12 }} />
                )}
                <p className={styles.transcript}>{attempt.transcript}</p>
            </Card>

            {feedback.corrections.length > 0 && (
                <Card title={translate('corrections_title')} size="small" style={{ marginTop: 12 }}>
                    <List
                        dataSource={feedback.corrections}
                        renderItem={(correction) => (
                            <List.Item>
                                <div>
                                    <del className={styles.correctionQuote}>{correction.quote}</del>
                                    {' → '}
                                    <strong>{correction.suggestion}</strong>
                                    <div className={styles.correctionIssue}>{correction.issue}</div>
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            {feedback.vocabularySuggestions.length > 0 && (
                <Card title={translate('vocab_title')} size="small" style={{ marginTop: 12 }}>
                    <Space direction="vertical">
                        {feedback.vocabularySuggestions.map((suggestion, index) => (
                            <div key={index}>
                                <Tag>{suggestion.original}</Tag>
                                {' → '}
                                <Tag color="green">{suggestion.better}</Tag>
                            </div>
                        ))}
                    </Space>
                </Card>
            )}

            {feedback.pronunciationNotes.length > 0 && (
                <Card title={translate('pronunciation_title')} size="small" style={{ marginTop: 12 }}>
                    <List
                        dataSource={feedback.pronunciationNotes}
                        renderItem={(note) => <List.Item>{note}</List.Item>}
                    />
                </Card>
            )}

            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} md={12}>
                    <Card
                        title={<span><CheckCircleOutlined style={{ color: '#16a34a', marginRight: 8 }} />{translate('strengths_title')}</span>}
                        size="small"
                    >
                        <List
                            dataSource={feedback.strengths}
                            renderItem={(strength) => <List.Item>{strength}</List.Item>}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        title={<span><RiseOutlined style={{ color: '#d97706', marginRight: 8 }} />{translate('improvements_title')}</span>}
                        size="small"
                    >
                        <List
                            dataSource={feedback.improvements}
                            renderItem={(improvement) => <List.Item>{improvement}</List.Item>}
                        />
                    </Card>
                </Col>
            </Row>

            {feedback.modelAnswer && (
                <Collapse
                    style={{ marginTop: 12 }}
                    items={[{
                        key: 'model-answer',
                        label: translate('model_answer_title'),
                        children: <p className={styles.modelAnswer}>{feedback.modelAnswer}</p>,
                    }]}
                />
            )}

            <Card
                title={<span><SoundOutlined style={{ marginRight: 8 }} />{translate('prosody_title')}</span>}
                size="small"
                style={{ marginTop: 12 }}
            >
                {(liveAttempt.prosodyStatus === 'pending' || liveAttempt.prosodyStatus === 'processing') && (
                    <Space>
                        <Spin size="small" />
                        <Typography.Text type="secondary">{translate('prosody_analyzing')}</Typography.Text>
                    </Space>
                )}
                {liveAttempt.prosodyStatus === 'failed' && (
                    <Typography.Text type="secondary">{translate('prosody_failed')}</Typography.Text>
                )}
                {liveAttempt.prosodyStatus === 'done' && liveAttempt.prosody?.intonation && (
                    <Row gutter={[12, 12]}>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={translate('prosody_pitch_range')}
                                value={liveAttempt.prosody.intonation.pitchRangeSemitones}
                                precision={1}
                                suffix="st"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={translate('prosody_f0_std')}
                                value={liveAttempt.prosody.intonation.f0Std}
                                precision={1}
                                suffix="Hz"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={translate('prosody_voiced_ratio')}
                                value={Math.round(liveAttempt.prosody.intonation.voicedRatio * 100)}
                                suffix="%"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <div>
                                <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>{translate('prosody_terminal_tone')}</div>
                                <Tag color={liveAttempt.prosody.intonation.terminalTone === 'falling' ? 'blue' : liveAttempt.prosody.intonation.terminalTone === 'rising' ? 'orange' : 'default'}>
                                    {liveAttempt.prosody.intonation.terminalTone === 'falling'
                                        ? translate('prosody_terminal_falling')
                                        : liveAttempt.prosody.intonation.terminalTone === 'rising'
                                        ? translate('prosody_terminal_rising')
                                        : translate('prosody_terminal_level')}
                                </Tag>
                            </div>
                        </Col>
                    </Row>
                )}
                {liveAttempt.prosodyStatus === 'done' && !liveAttempt.prosody?.intonation && (
                    <Typography.Text type="secondary">{translate('prosody_failed')}</Typography.Text>
                )}
            </Card>

            <Space style={{ marginTop: 20 }} wrap>
                <Button type="primary" icon={<RedoOutlined />} onClick={onRetry}>
                    {translate('try_again')}
                </Button>
                <Button icon={<UnorderedListOutlined />} onClick={onBack}>
                    {translate('pick_another')}
                </Button>
            </Space>
        </div>
    );
}
