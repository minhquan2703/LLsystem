import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import { Button, Card, Col, Row } from 'antd';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import HskLevelPicker from './hsk.level.picker';

interface IProps {
    isAdmin: boolean;
}

export default async function UserDashboard({ isAdmin }: IProps) {
    const session = await auth();
    const translate = await getTranslations('dashboard');

    const statsResponse = await sendRequest<IBackendRes<ILearningStats>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/stats`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    })

    const userResponse = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${session?.user?._id}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        nextOption: {
            next: { tags: ['user-profile'] },
        },
    })

    const stats = statsResponse?.data ?? { total: 0, dueToday: 0 };
    const hskLevel = userResponse?.data?.hskLevel ?? null;

    return (
        <main style={{
            padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 48px)',
            maxWidth: 960,
            margin: '0 auto',
        }}>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, marginBottom: 24 }}>
                {translate('greeting')}, {session?.user?.name}
            </h2>

            <HskLevelPicker currentLevel={hskLevel} />

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                            {translate('total_words')}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
                            {stats.total}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                            {translate('due_today')}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: stats.dueToday > 0 ? '#1677ff' : '#9ca3af' }}>
                            {stats.dueToday}
                        </div>
                    </Card>
                </Col>

                {isAdmin && (
                    <Col xs={24} sm={12} md={8}>
                        <Card>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                                {translate('admin_panel_title')}
                            </div>
                            <Link href="/dashboard">
                                <Button type="default" size="small">{translate('admin_panel_link')}</Button>
                            </Link>
                        </Card>
                    </Col>
                )}
            </Row>

            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {stats.dueToday > 0 ? (
                    <Link href="/learn">
                        <Button type="primary" size="large">
                            {translate('review_now_count', { count: stats.dueToday })}
                        </Button>
                    </Link>
                ) : stats.total > 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: 500 }}>
                        {translate('all_done')}
                    </span>
                ) : (
                    <span style={{ color: '#6b7280' }}>
                        {translate('start_learning')}
                    </span>
                )}
                <Link href="/quiz">
                    <Button type="default" size="large">{translate('start_quiz')}</Button>
                </Link>
                <Link href="/words">
                    <Button type="default" size="large">{translate('browse_words')}</Button>
                </Link>
            </div>
        </main>
    )
}
