import HeaderHome from '@/components/layout/header.home';
import { Button, Card, Col, Row, Tag } from 'antd';
import {
    ApiOutlined,
    CoffeeOutlined,
    CompassOutlined,
    TeamOutlined,
    SolutionOutlined,
    HeartOutlined,
    ReadOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    HomeOutlined,
    CarOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import styles from './page.module.css';

const mockTopics = [
    {
        id: 1,
        icon: <ApiOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
        name: 'Động vật',
        nameZh: '动物',
        wordCount: 48,
        hskRange: '1-3',
        color: '#f59e0b',
    },
    {
        id: 2,
        icon: <CoffeeOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
        name: 'Ẩm thực',
        nameZh: '饮食',
        wordCount: 72,
        hskRange: '1-4',
        color: '#ef4444',
    },
    {
        id: 3,
        icon: <CompassOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
        name: 'Du lịch',
        nameZh: '旅游',
        wordCount: 95,
        hskRange: '2-5',
        color: '#1677ff',
    },
    {
        id: 4,
        icon: <TeamOutlined style={{ fontSize: 28, color: '#16a34a' }} />,
        name: 'Gia đình',
        nameZh: '家庭',
        wordCount: 35,
        hskRange: '1-2',
        color: '#16a34a',
    },
    {
        id: 5,
        icon: <SolutionOutlined style={{ fontSize: 28, color: '#7c3aed' }} />,
        name: 'Công việc',
        nameZh: '工作',
        wordCount: 110,
        hskRange: '3-6',
        color: '#7c3aed',
    },
    {
        id: 6,
        icon: <HeartOutlined style={{ fontSize: 28, color: '#0891b2' }} />,
        name: 'Sức khỏe',
        nameZh: '健康',
        wordCount: 67,
        hskRange: '3-5',
        color: '#0891b2',
    },
    {
        id: 7,
        icon: <ReadOutlined style={{ fontSize: 28, color: '#d97706' }} />,
        name: 'Giáo dục',
        nameZh: '教育',
        wordCount: 84,
        hskRange: '2-6',
        color: '#d97706',
    },
    {
        id: 8,
        icon: <EnvironmentOutlined style={{ fontSize: 28, color: '#059669' }} />,
        name: 'Môi trường',
        nameZh: '环境',
        wordCount: 43,
        hskRange: '4-7',
        color: '#059669',
    },
    {
        id: 9,
        icon: <GlobalOutlined style={{ fontSize: 28, color: '#dc2626' }} />,
        name: 'Văn hóa',
        nameZh: '文化',
        wordCount: 129,
        hskRange: '3-8',
        color: '#dc2626',
    },
    {
        id: 10,
        icon: <HomeOutlined style={{ fontSize: 28, color: '#6366f1' }} />,
        name: 'Nhà ở',
        nameZh: '住房',
        wordCount: 52,
        hskRange: '1-3',
        color: '#6366f1',
    },
    {
        id: 11,
        icon: <CarOutlined style={{ fontSize: 28, color: '#f97316' }} />,
        name: 'Giao thông',
        nameZh: '交通',
        wordCount: 61,
        hskRange: '2-4',
        color: '#f97316',
    },
    {
        id: 12,
        icon: <DollarOutlined style={{ fontSize: 28, color: '#84cc16' }} />,
        name: 'Tài chính',
        nameZh: '金融',
        wordCount: 88,
        hskRange: '4-9',
        color: '#84cc16',
    },
];

const totalWords = mockTopics.reduce((sum, topic) => sum + topic.wordCount, 0);

export default async function TopicsPage() {
    return (
        <div>
            <HeaderHome />
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Học theo chủ đề</h1>
                    <p className={styles.pageSubtitle}>
                        {mockTopics.length} chủ đề · {totalWords.toLocaleString('vi-VN')} từ vựng
                    </p>
                </div>

                <Row gutter={[16, 16]}>
                    {mockTopics.map((topic) => (
                        <Col key={topic.id} xs={12} sm={8} md={6}>
                            <Card
                                hoverable
                                className={styles.topicCard}
                                styles={{ body: { padding: '24px 16px 20px' } }}
                            >
                                <div className={styles.topicIcon}>{topic.icon}</div>
                                <div className={styles.topicName}>{topic.name}</div>
                                <div className={styles.topicNameZh}>{topic.nameZh}</div>
                                <div className={styles.topicMeta}>
                                    <Tag>{topic.wordCount} từ</Tag>
                                    <Tag color="blue">HSK {topic.hskRange}</Tag>
                                </div>
                                <Link href="/words">
                                    <Button
                                        type="primary"
                                        size="small"
                                        block
                                        style={{ marginTop: 14 }}
                                    >
                                        Học ngay
                                    </Button>
                                </Link>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
