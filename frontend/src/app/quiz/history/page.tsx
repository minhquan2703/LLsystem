import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { sendRequest } from '@/utils/api';
import { Card, Col, Empty, Row, Statistic } from 'antd';
import { CheckCircleOutlined, FireOutlined, TrophyOutlined } from '@ant-design/icons';
import HeaderHome from '@/components/layout/header.home';
import QuizHistoryTable from './quiz.history.table';
import styles from '@/app/quiz/page.module.css';

export default async function QuizHistoryPage() {
    const [session, translate] = await Promise.all([
        auth(),
        getTranslations('quiz'),
    ]);
    if (!session) {
        redirect('/auth/login');
    }

    const [historyRes, statsRes] = await Promise.all([
        sendRequest<IBackendRes<IQuizAttempt[]>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quiz/attempts`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        }),
        sendRequest<IBackendRes<IQuizStats>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quiz/stats`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.user?.access_token}`,
            },
        }),
    ]);

    const attempts = historyRes?.data ?? [];
    const stats = statsRes?.data;

    return (
        <div>
            <HeaderHome />
            <div className={styles.landingContainer} style={{ maxWidth: 880 }}>
                <h1 className={styles.landingTitle}>{translate('history_title')}</h1>
                <p className={styles.landingSubtitle}>{translate('history_subtitle')}</p>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('stats_total_attempts')}
                                value={stats?.totalAttempts ?? 0}
                                prefix={<FireOutlined />}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('stats_average_score')}
                                value={stats?.averageScore ?? 0}
                                suffix="%"
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#16a34a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('stats_best_score')}
                                value={stats?.bestScore ?? 0}
                                suffix="%"
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: '#f59e0b' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card styles={{ body: { padding: '20px 24px' } }}>
                            <Statistic
                                title={translate('stats_total_questions')}
                                value={stats?.totalQuestionsAnswered ?? 0}
                                valueStyle={{ color: '#6b7280' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card>
                    {attempts.length > 0 ? (
                        <QuizHistoryTable attempts={attempts} />
                    ) : (
                        <Empty description={translate('history_empty')} />
                    )}
                </Card>
            </div>
        </div>
    );
}
