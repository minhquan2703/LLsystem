import { Button, Card, Col, Row } from 'antd'
import { BookOutlined, FileTextOutlined, TagsOutlined } from '@ant-design/icons'
import Link from 'next/link'

const FEATURES = [
    {
        icon: <TagsOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
        title: 'Chủ đề phân loại',
        desc: 'Từ vựng được tổ chức theo chủ đề: gia đình, công việc, du lịch, ẩm thực...',
    },
    {
        icon: <BookOutlined style={{ fontSize: 32, color: '#16a34a' }} />,
        title: 'Từ vựng có hệ thống',
        desc: 'Mỗi từ đi kèm phiên âm pinyin, nghĩa tiếng Anh và tiếng Việt đầy đủ.',
    },
    {
        icon: <FileTextOutlined style={{ fontSize: 32, color: '#d97706' }} />,
        title: 'Câu ví dụ thực tế',
        desc: 'Học từ vựng qua câu ví dụ có ngữ cảnh, giúp ghi nhớ tự nhiên hơn.',
    },
]

interface IProps {
    isLoggedIn: boolean
    isAdmin: boolean
}

export default function HomePage({ isLoggedIn, isAdmin }: IProps) {
    return (
        <main>
            {/* Hero */}
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
                    Học Tiếng Trung<br />Có Hệ Thống
                </h1>
                <p style={{
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    color: '#6b7280',
                    maxWidth: 480,
                    margin: '0 auto 36px',
                    lineHeight: 1.75,
                }}>
                    Hệ thống học từ vựng tiếng Trung phân loại theo chủ đề,<br />
                    có pinyin và câu ví dụ thực tế đi kèm.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {isLoggedIn ? (
                        isAdmin && (
                            <Link href="/dashboard">
                                <Button type="primary" size="large">Vào Dashboard</Button>
                            </Link>
                        )
                    ) : (
                        <>
                            <Link href="/auth/register">
                                <Button type="primary" size="large">Bắt đầu miễn phí</Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button size="large">Đăng nhập</Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features */}
            <section style={{
                padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 8vw, 80px)',
                maxWidth: 960,
                margin: '0 auto',
            }}>
                <Row gutter={[24, 24]}>
                    {FEATURES.map((f) => (
                        <Col key={f.title} xs={24} md={8}>
                            <Card
                                hoverable
                                style={{ height: '100%', textAlign: 'center' }}
                                styles={{ body: { padding: '28px 20px' } }}
                            >
                                <div style={{ marginBottom: 16 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>
                                    {f.title}
                                </h3>
                                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.65 }}>
                                    {f.desc}
                                </p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </section>
        </main>
    )
}