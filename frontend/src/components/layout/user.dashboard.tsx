import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import { Button, Card, Col, Row, Statistic, Tag } from 'antd';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import HskLevelPicker from './hsk.level.picker';

interface IProps {
    isAdmin: boolean;
}

export default async function UserDashboard({ isAdmin }: IProps) {
    const session = await auth();
    const translate = await getTranslations('dashboard');

    const [statsResponse, userResponse] = await Promise.all([
        sendRequest<IBackendRes<ILearningStats>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/stats`,
            method: 'GET',
            headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        }),
        sendRequest<IBackendRes<IUser>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${session?.user?._id}`,
            method: 'GET',
            headers: { Authorization: `Bearer ${session?.user?.access_token}` },
            nextOption: { next: { tags: ['user-profile'] } },
        }),
    ]);

    const stats = statsResponse?.data ?? { total: 0, dueToday: 0 };
    const hskLevel = userResponse?.data?.hskLevel ?? null;

    return (
        <main style={{
            padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 48px)',
            maxWidth: 960,
            margin: '0 auto',
        }}>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, margin: 0 }}>
                    {translate('greeting')}, {session?.user?.name}
                </h2>
                {isAdmin && (
                    <Link href="/dashboard" style={{ fontSize: 13, color: '#6b7280' }}>
                        Admin panel →
                    </Link>
                )}
            </div>

            {/* IELTS English lane */}
            <section style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🇬🇧</span>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>IELTS English</span>
                </div>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card
                            hoverable
                            style={{ height: '100%', borderColor: '#e0e7ff' }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                                Vocab Practice
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
                                Luyện synonym + câu ví dụ theo phiên. Gemini chấm band từng từ.
                            </div>
                            <Link href="/vocab-practice">
                                <Button type="primary">Bắt đầu →</Button>
                            </Link>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            hoverable
                            style={{ height: '100%', borderColor: '#e0e7ff' }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>🎤</div>
                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                                Speaking Coach
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
                                Trả lời câu hỏi IELTS Speaking Part 1–3. Gemini chấm 4 tiêu chí.
                            </div>
                            <Link href="/speaking">
                                <Button type="primary">{translate('start_speaking')} →</Button>
                            </Link>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Tiếng Trung lane */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🇨🇳</span>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Tiếng Trung</span>
                    {hskLevel && (
                        <Tag color="blue" style={{ marginLeft: 4 }}>HSK {hskLevel}</Tag>
                    )}
                </div>

                <Card>
                    <Row gutter={[24, 16]} align="middle">
                        <Col xs={12} sm={6}>
                            <Statistic
                                title={translate('total_words')}
                                value={stats.total}
                                valueStyle={{ fontSize: 24 }}
                            />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Statistic
                                title={translate('due_today')}
                                value={stats.dueToday}
                                valueStyle={{ fontSize: 24, color: stats.dueToday > 0 ? '#1677ff' : '#9ca3af' }}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {stats.dueToday > 0 ? (
                                    <Link href="/learn">
                                        <Button type="primary" size="small">
                                            {translate('review_now_count', { count: stats.dueToday })}
                                        </Button>
                                    </Link>
                                ) : (
                                    <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                                        {stats.total > 0 ? translate('all_done') : translate('start_learning')}
                                    </span>
                                )}
                                <Link href="/quiz">
                                    <Button size="small">{translate('start_quiz')}</Button>
                                </Link>
                                <Link href="/words">
                                    <Button size="small">{translate('browse_words')}</Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>

                </Card>

                <div style={{ marginTop: 12 }}>
                    <HskLevelPicker currentLevel={hskLevel} />
                </div>
            </section>
        </main>
    );
}
