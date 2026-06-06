import { BookOutlined, FileTextOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row } from 'antd';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function HomePage() {
    const translate = await getTranslations('home');

    const featureList = [
        {
            icon: <TagsOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
            title: translate('feature_topics_title'),
            desc: translate('feature_topics_desc'),
        },
        {
            icon: <BookOutlined style={{ fontSize: 32, color: '#16a34a' }} />,
            title: translate('feature_vocab_title'),
            desc: translate('feature_vocab_desc'),
        },
        {
            icon: <FileTextOutlined style={{ fontSize: 32, color: '#d97706' }} />,
            title: translate('feature_srs_title'),
            desc: translate('feature_srs_desc'),
        },
    ]

    const statList = [
        { value: '120 000+', label: translate('stat_words') },
        { value: 'HSK 1–9', label: translate('stat_hsk') },
        { value: '100%', label: translate('stat_free') },
    ]

    return (
        <main>
            <section style={{
                textAlign: 'center',
                padding: 'clamp(48px, 8vw, 88px) clamp(16px, 4vw, 48px) clamp(36px, 6vw, 64px)',
            }}>
                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 52px)',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.2,
                    margin: '0 0 16px',
                }}>
                    {translate('hero_title')}<br />
                    <span style={{ color: '#1677ff' }}>{translate('hero_title_accent')}</span>
                </h1>
                <p style={{
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    color: '#6b7280',
                    maxWidth: 480,
                    margin: '0 auto 36px',
                    lineHeight: 1.75,
                }}>
                    {translate('hero_desc')}
                </p>
                <Link href="/auth/register">
                    <Button type="primary" size="large">{translate('start_free')}</Button>
                </Link>
            </section>

            <section style={{
                padding: '0 clamp(16px, 4vw, 48px) 48px',
                maxWidth: 720,
                margin: '0 auto',
            }}>
                <Row gutter={[24, 16]} justify="center">
                    {statList.map(stat => (
                        <Col key={stat.label} xs={8}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#1677ff' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                                    {stat.label}
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </section>

            <section style={{
                padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 8vw, 80px)',
                maxWidth: 960,
                margin: '0 auto',
            }}>
                <Row gutter={[24, 24]}>
                    {featureList.map(feature => (
                        <Col key={feature.title} xs={24} md={8}>
                            <Card
                                hoverable
                                style={{ height: '100%', textAlign: 'center' }}
                                styles={{ body: { padding: '28px 20px' } }}
                            >
                                <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>
                                    {feature.title}
                                </h3>
                                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.65 }}>
                                    {feature.desc}
                                </p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </section>
        </main>
    )
}
