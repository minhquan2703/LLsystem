'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Col, Row, Segmented, Statistic } from 'antd';
import { ThunderboltOutlined, SettingOutlined, HistoryOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';

interface Props {
    stats?: IQuizStats;
}

export default function QuizLanding({ stats }: Props) {
    const [direction, setDirection] = useState<QuizDirection>('zh-to-meaning');
    const router = useRouter();
    const translate = useTranslations('quiz');

    const startDefault = () => {
        router.push(`/quiz/play?direction=${direction}&timer=15`);
    };

    const startCustom = () => {
        router.push('/quiz/custom');
    };

    return (
        <div className={styles.landingContainer}>
            <h1 className={styles.landingTitle}>{translate('landing_title')}</h1>
            <p className={styles.landingSubtitle}>{translate('landing_subtitle')}</p>

            <Segmented
                block
                size="large"
                value={direction}
                onChange={(value) => setDirection(value as QuizDirection)}
                options={[
                    { label: translate('dir_zh_to_meaning'), value: 'zh-to-meaning' },
                    { label: translate('dir_meaning_to_zh'), value: 'meaning-to-zh' },
                ]}
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card hoverable className={styles.modeCard} onClick={startDefault}>
                        <ThunderboltOutlined className={styles.modeIcon} style={{ color: '#1677ff' }} />
                        <div className={styles.modeTitle}>{translate('default_title')}</div>
                        <div className={styles.modeDesc}>{translate('default_desc')}</div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card hoverable className={styles.modeCard} onClick={startCustom}>
                        <SettingOutlined className={styles.modeIcon} style={{ color: '#722ed1' }} />
                        <div className={styles.modeTitle}>{translate('custom_title')}</div>
                        <div className={styles.modeDesc}>{translate('custom_desc')}</div>
                    </Card>
                </Col>
            </Row>

            {stats && stats.totalAttempts > 0 && (
                <Card className={styles.statsSummaryCard}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={12} md={6}>
                            <Statistic
                                title={translate('stats_total_attempts')}
                                value={stats.totalAttempts}
                                prefix={<HistoryOutlined />}
                                valueStyle={{ fontSize: 20, color: '#1677ff' }}
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={translate('stats_average_score')}
                                value={stats.averageScore}
                                suffix="%"
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ fontSize: 20, color: '#16a34a' }}
                            />
                        </Col>
                        <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                            <Link href="/quiz/history">{translate('view_history')}</Link>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}
