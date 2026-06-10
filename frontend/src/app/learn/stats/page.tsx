import HeaderHome from '@/components/layout/header.home';
import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import { getTranslations } from 'next-intl/server';
import { Card, Col, Progress, Row, Statistic, Tag } from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    PauseCircleOutlined,
    StarOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';

const hskBreakdown = [
    { level: 1, learned: 150, total: 150, color: '#16a34a' },
    { level: 2, learned: 89, total: 150, color: '#2563eb' },
    { level: 3, learned: 45, total: 300, color: '#0891b2' },
    { level: 4, learned: 12, total: 600, color: '#7c3aed' },
    { level: 5, learned: 3, total: 1200, color: '#d97706' },
    { level: 6, learned: 0, total: 5000, color: '#dc2626' },
];

const weeklyReviews = [8, 12, 5, 18, 24, 15, 12];
const weeklyMax = Math.max(...weeklyReviews);

const activityData = [
    3, 0, 8, 12, 5, 0, 0,
    15, 10, 7, 20, 4, 0, 0,
    8, 14, 9, 11, 0, 0, 0,
    18, 24, 16, 8, 5, 0, 0,
    12, 15,
];

function getActivityColor(count: number): string {
    if (count === 0) { return '#f0f0f0'; }
    if (count <= 5) { return '#bfdbfe'; }
    if (count <= 12) { return '#60a5fa'; }
    if (count <= 20) { return '#2563eb'; }
    return '#1e40af';
}

export default async function LearnStatsPage() {
    const [session, translate] = await Promise.all([
        auth(),
        getTranslations('stats'),
    ]);

    const statsRes = await sendRequest<IBackendRes<ILearningStats>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/stats`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    });

    const stats = statsRes?.data;
    const activeCount = (stats?.newCount ?? 0) + (stats?.learningCount ?? 0) + (stats?.reviewCount ?? 0);
    const totalForProgress = stats?.total ?? 1;

    const masterLevels = [
        { label: translate('state_new'), count: stats?.newCount ?? 0, color: '#6b7280' },
        { label: translate('state_learning'), count: stats?.learningCount ?? 0, color: '#f59e0b' },
        { label: translate('state_review'), count: stats?.reviewCount ?? 0, color: '#1677ff' },
        { label: translate('state_suspended'), count: stats?.suspendedCount ?? 0, color: '#ef4444' },
    ];

    const weekDays = [
        translate('weekday_0'),
        translate('weekday_1'),
        translate('weekday_2'),
        translate('weekday_3'),
        translate('weekday_4'),
        translate('weekday_5'),
        translate('weekday_6'),
    ];

    return (
        <div>
            <HeaderHome />
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>{translate('page_title')}</h1>

                <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('studying')}
                                value={activeCount}
                                suffix={translate('word_suffix')}
                                prefix={<BookOutlined />}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('due_today')}
                                value={stats?.dueToday ?? 0}
                                suffix={translate('word_suffix')}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#d97706' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('mastered')}
                                value={stats?.reviewCount ?? 0}
                                suffix={translate('word_suffix')}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#16a34a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('total_added')}
                                value={stats?.total ?? 0}
                                suffix={translate('word_suffix')}
                                prefix={<StarOutlined />}
                                valueStyle={{ color: '#6b7280' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={12}>
                        <Card title={translate('memory_levels')} style={{ height: '100%' }}>
                            <div className={styles.masterList}>
                                {masterLevels.map((level) => (
                                    <div key={level.label} className={styles.masterRow}>
                                        <div className={styles.masterLabel}>
                                            <span>{level.label}</span>
                                            <span style={{ color: level.color, fontWeight: 600 }}>
                                                {level.count}
                                            </span>
                                        </div>
                                        <Progress
                                            percent={totalForProgress > 0 ? Math.round((level.count / totalForProgress) * 100) : 0}
                                            strokeColor={level.color}
                                            showInfo={false}
                                            size="small"
                                        />
                                    </div>
                                ))}
                                {(stats?.suspendedCount ?? 0) > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <PauseCircleOutlined style={{ color: '#ef4444' }} />
                                        {translate('leech_hint', { count: stats!.suspendedCount })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card title={translate('activity_title')} style={{ height: '100%' }}>
                            <div className={styles.activityGrid}>
                                {activityData.map((count, index) => (
                                    <div
                                        key={index}
                                        className={styles.activityCell}
                                        style={{ background: getActivityColor(count) }}
                                        title={translate('activity_tooltip', { count })}
                                    />
                                ))}
                            </div>
                            <div className={styles.activityLegend}>
                                <span>{translate('activity_less')}</span>
                                {['#f0f0f0', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'].map((color) => (
                                    <div
                                        key={color}
                                        className={styles.legendCell}
                                        style={{ background: color }}
                                    />
                                ))}
                                <span>{translate('activity_more')}</span>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} md={14}>
                        <Card title={translate('hsk_progress')}>
                            <div className={styles.hskList}>
                                {hskBreakdown.map((hsk) => (
                                    <div key={hsk.level} className={styles.hskRow}>
                                        <Tag
                                            color={hsk.color}
                                            style={{ width: 56, textAlign: 'center', flexShrink: 0 }}
                                        >
                                            HSK {hsk.level}
                                        </Tag>
                                        <div className={styles.hskBarWrapper}>
                                            <div
                                                className={styles.hskBar}
                                                style={{
                                                    width: `${(hsk.learned / hsk.total) * 100}%`,
                                                    background: hsk.color,
                                                }}
                                            />
                                        </div>
                                        <span className={styles.hskCount}>
                                            {hsk.learned}/{hsk.total}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={10}>
                        <Card title={translate('weekly_title')}>
                            <div className={styles.weeklyChart}>
                                {weeklyReviews.map((count, index) => (
                                    <div key={weekDays[index]} className={styles.weeklyCol}>
                                        <span className={styles.weeklyCount}>{count}</span>
                                        <div className={styles.weeklyBarWrapper}>
                                            <div
                                                className={styles.weeklyBar}
                                                style={{ height: `${(count / weeklyMax) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.weeklyDay}>{weekDays[index]}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
