'use client'

import { useState, useEffect } from 'react';
import { Button, Card, Input, Tag, Typography, Row, Col, Progress, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { handleSaveDraftAction } from '@/utils/actions';
import styles from './vocab.practice.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AttemptDraft {
    senseId: number;
    synonymsInput: string[];
    exampleInput: string;
}

interface Props {
    session: IVocabSession;
    senses: IEnglishWordSense[];
    onSubmit: (attempts: AttemptDraft[]) => Promise<void>;
    isSubmitting: boolean;
    initialDrafts?: AttemptDraft[];
    initialSenseIndex?: number;
}

export default function VocabSession({ session, senses, onSubmit, isSubmitting, initialDrafts, initialSenseIndex }: Props) {
    const [currentIndex, setCurrentIndex] = useState(initialSenseIndex ?? 0);
    const [synonymInput, setSynonymInput] = useState('');
    const [drafts, setDrafts] = useState<AttemptDraft[]>(() => {
        if (initialDrafts && initialDrafts.length === senses.length) {
            return initialDrafts;
        }
        return senses.map(s => ({ senseId: s.id, synonymsInput: [], exampleInput: '' }));
    });

    //debounce auto-save draft mỗi 2 giây sau khi user thay đổi
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSaveDraftAction(session.id, drafts, currentIndex);
        }, 2000);
        return () => clearTimeout(timer);
    }, [drafts, currentIndex]);

    const currentSense = senses[currentIndex];
    const currentDraft = drafts[currentIndex];
    const isLastSense = currentIndex === senses.length - 1;

    const updateDraft = (update: Partial<AttemptDraft>) => {
        setDrafts(prev =>
            prev.map((d, i) => (i === currentIndex ? { ...d, ...update } : d)),
        );
    };

    const addSynonym = () => {
        const trimmed = synonymInput.trim().toLowerCase();
        if (!trimmed || currentDraft.synonymsInput.includes(trimmed)) return;
        updateDraft({ synonymsInput: [...currentDraft.synonymsInput, trimmed] });
        setSynonymInput('');
    };

    const removeSynonym = (word: string) => {
        updateDraft({ synonymsInput: currentDraft.synonymsInput.filter(s => s !== word) });
    };

    const handleNext = () => {
        if (synonymInput.trim()) {
            addSynonym();
        }
        if (currentIndex < senses.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSynonymInput('');
        }
    };

    const handleSubmit = async () => {
        if (synonymInput.trim()) {
            const trimmed = synonymInput.trim().toLowerCase();
            if (!currentDraft.synonymsInput.includes(trimmed)) {
                updateDraft({ synonymsInput: [...currentDraft.synonymsInput, trimmed] });
            }
        }
        await onSubmit(drafts);
    };

    if (!currentSense) return null;

    return (
        <div className={styles.sessionContainer}>
            <div className={styles.sessionHeader}>
                <Text type="secondary">
                    Phiên {session.sessionIndex} — từ {currentIndex + 1}/{senses.length}
                </Text>
                <Progress
                    percent={Math.round((currentIndex / senses.length) * 100)}
                    showInfo={false}
                    strokeColor="#4f46e5"
                    size="small"
                    style={{ width: 120 }}
                />
            </div>

            <Card className={styles.wordCard}>
                <div className={styles.wordHeader}>
                    <Title level={2} className={styles.wordLemma}>
                        {currentSense.word?.lemma}
                    </Title>
                    <Space>
                        {currentSense.pos && (
                            <Tag color="blue">{currentSense.pos}</Tag>
                        )}
                        {currentSense.tier === 'academic' && (
                            <Tag color="purple">academic</Tag>
                        )}
                    </Space>
                </div>

                <div className={styles.glossSection}>
                    <Text className={styles.glossEn}>{currentSense.glossEn}</Text>
                    {currentSense.glossVi && (
                        <Text type="secondary" className={styles.glossVi}>
                            {currentSense.glossVi}
                        </Text>
                    )}
                </div>

                {currentSense.contextTags.length > 0 && (
                    <div className={styles.contextTags}>
                        {currentSense.contextTags.map(tag => (
                            <Tag key={tag}>{tag}</Tag>
                        ))}
                    </div>
                )}
            </Card>

            <Row gutter={[16, 16]} className={styles.inputSection}>
                <Col xs={24} md={12}>
                    <Card
                        size="small"
                        title={<Text strong>Synonym</Text>}
                        extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                gõ từ đồng nghĩa, Enter để thêm
                            </Text>
                        }
                    >
                        <div className={styles.synonymTags}>
                            {currentDraft.synonymsInput.map(word => (
                                <Tag
                                    key={word}
                                    closable
                                    onClose={() => removeSynonym(word)}
                                    icon={null}
                                    color="geekblue"
                                >
                                    {word}
                                </Tag>
                            ))}
                        </div>
                        <Input
                            placeholder="Nhập synonym..."
                            value={synonymInput}
                            onChange={e => setSynonymInput(e.target.value)}
                            onPressEnter={addSynonym}
                            suffix={
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={addSynonym}
                                    disabled={!synonymInput.trim()}
                                />
                            }
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        size="small"
                        title={<Text strong>Example sentence</Text>}
                        extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                dùng từ này trong một câu
                            </Text>
                        }
                    >
                        {currentSense.exampleEn && (
                            <Paragraph
                                italic
                                type="secondary"
                                style={{ fontSize: 12, marginBottom: 8 }}
                            >
                                Gợi ý: {currentSense.exampleEn}
                            </Paragraph>
                        )}
                        <TextArea
                            rows={3}
                            placeholder="Viết câu ví dụ bằng tiếng Anh..."
                            value={currentDraft.exampleInput}
                            onChange={e => updateDraft({ exampleInput: e.target.value })}
                            maxLength={300}
                            showCount
                        />
                    </Card>
                </Col>
            </Row>

            <div className={styles.sessionActions}>
                {currentIndex > 0 && (
                    <Button onClick={() => setCurrentIndex(prev => prev - 1)}>
                        Quay lại
                    </Button>
                )}
                {!isLastSense ? (
                    <Button type="primary" onClick={handleNext}>
                        Từ tiếp theo →
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                    >
                        Nộp phiên
                    </Button>
                )}
            </div>

            <div className={styles.senseNav}>
                {senses.map((s, i) => (
                    <div
                        key={s.id}
                        className={`${styles.senseNavDot} ${i === currentIndex ? styles.senseNavDotActive : ''} ${drafts[i].synonymsInput.length > 0 || drafts[i].exampleInput ? styles.senseNavDotFilled : ''}`}
                        onClick={() => setCurrentIndex(i)}
                        title={s.word?.lemma}
                    />
                ))}
            </div>
        </div>
    );
}
