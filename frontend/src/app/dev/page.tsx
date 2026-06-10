import HeaderHome from '@/components/layout/header.home';
import { Card, Col, Collapse, Empty, Row, Tag } from 'antd';
import { CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import implementations from '@/data/notable-implementations.json';
import styles from './page.module.css';

const categoryColor: Record<string, string> = {
    'Thuật toán': 'purple',
    'Backend - Auth': 'blue',
    'Tích hợp AI': 'magenta',
    'Frontend - UI State': 'cyan',
    'Frontend - Next.js': 'green',
    'Backend - NestJS': 'geekblue',
};

export default function DevPage() {
    return (
        <div>
            <HeaderHome />
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Những vấn đề đã gặp trong dự án</h1>
                <p className={styles.pageIntro}>
                    Ghi chú cá nhân về các đoạn code trong LLsystem
                    kèm phần giải thích chi tiết
                </p>

                <Row gutter={[20, 20]}>
                    {implementations.map((item) => (
                        <Col xs={24} md={12} key={item.id}>
                            <Card
                                className={styles.card}
                                title={
                                    <div className={styles.cardTitle}>
                                        <CodeOutlined />
                                        <span className={styles.cardTitleText}>{item.title}</span>
                                        <Tag
                                            className={styles.categoryTag}
                                            color={categoryColor[item.category] ?? 'default'}
                                        >
                                            {item.category}
                                        </Tag>
                                    </div>
                                }
                            >
                                <div className={styles.filePath}>
                                    <FileTextOutlined />
                                    <code className={styles.inlineCode}>{item.filePath}</code>
                                </div>
                                <p className={styles.summary}>{item.summary}</p>

                                {item.explanation ? (
                                    <Collapse
                                        ghost
                                        items={[
                                            {
                                                key: 'explanation',
                                                label: <span className={styles.collapseLabel}>Giải thích chi tiết</span>,
                                                children: (
                                                    <p className={styles.explanation}>
                                                        {item.explanation}
                                                    </p>
                                                ),
                                            },
                                        ]}
                                    />
                                ) : (
                                    <Empty
                                        description="Chưa giải thích cho mục này"
                                        className={styles.emptyExplanation}
                                    />
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
