'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Radio, Row, Segmented, Select, Slider, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import styles from '../page.module.css';

const HSK_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => ({ value: level, label: `HSK ${level}` }));
const TIMER_SECONDS = 15;

interface Props {
    topics: ITopic[];
}

export default function QuizCustomForm({ topics }: Props) {
    const router = useRouter();
    const translate = useTranslations('quiz');

    const [direction, setDirection] = useState<QuizDirection>('zh-to-meaning');
    const [topicIds, setTopicIds] = useState<number[]>([]);
    const [hskLevels, setHskLevels] = useState<number[]>([]);
    const [questionCount, setQuestionCount] = useState(10);
    const [optionCount, setOptionCount] = useState(4);
    const [wordSource, setWordSource] = useState<QuizWordSource>('mixed');
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [practiceMode, setPracticeMode] = useState(false);

    const topicOptions = topics.map((topic) => ({ value: topic.id, label: topic.nameVi || topic.name }));

    const handleStart = () => {
        const params = new URLSearchParams();
        params.set('direction', direction);
        params.set('count', String(questionCount));
        params.set('options', String(optionCount));
        params.set('source', wordSource);
        if (topicIds.length > 0) {
            params.set('topics', topicIds.join(','));
        }
        if (hskLevels.length > 0) {
            params.set('hskLevels', hskLevels.join(','));
        }
        params.set('timer', timerEnabled ? String(TIMER_SECONDS) : 'off');
        if (practiceMode) {
            params.set('practice', '1');
        }
        router.push(`/quiz/play?${params.toString()}`);
    };

    return (
        <div className={styles.landingContainer}>
            <h1 className={styles.landingTitle}>{translate('custom_title')}</h1>
            <p className={styles.landingSubtitle}>{translate('custom_desc')}</p>

            <Card className={styles.configCard}>
                <Row gutter={[24, 24]}>
                    <Col xs={24}>
                        <div className={styles.configLabel}>{translate('config_direction_label')}</div>
                        <Segmented
                            block
                            value={direction}
                            onChange={(value) => setDirection(value as QuizDirection)}
                            options={[
                                { label: translate('dir_zh_to_meaning'), value: 'zh-to-meaning' },
                                { label: translate('dir_meaning_to_zh'), value: 'meaning-to-zh' },
                            ]}
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <div className={styles.configLabel}>{translate('config_topics_label')}</div>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={translate('config_topics_placeholder')}
                            value={topicIds}
                            onChange={(value) => setTopicIds(value)}
                            options={topicOptions}
                            style={{ width: '100%' }}
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <div className={styles.configLabel}>{translate('config_hsk_label')}</div>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={translate('config_hsk_placeholder')}
                            value={hskLevels}
                            onChange={(value) => setHskLevels(value)}
                            options={HSK_LEVEL_OPTIONS}
                            style={{ width: '100%' }}
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <div className={styles.configLabel}>
                            {translate('config_question_count_label', { count: questionCount })}
                        </div>
                        <Slider min={5} max={50} step={5} value={questionCount} onChange={setQuestionCount} />
                    </Col>

                    <Col xs={24} md={12}>
                        <div className={styles.configLabel}>{translate('config_option_count_label')}</div>
                        <Radio.Group
                            value={optionCount}
                            onChange={(e) => setOptionCount(e.target.value)}
                            options={[2, 3, 4, 5, 6].map((value) => ({ value, label: value }))}
                            optionType="button"
                            style={{ display: 'flex' }}
                        />
                    </Col>

                    <Col xs={24}>
                        <div className={styles.configLabel}>{translate('config_word_source_label')}</div>
                        <Radio.Group
                            value={wordSource}
                            onChange={(e) => setWordSource(e.target.value)}
                            style={{ display: 'flex' }}
                        >
                            <Radio.Button value="mine" style={{ width: '33.33%', textAlign: 'center' }}>
                                {translate('config_word_source_mine')}
                            </Radio.Button>
                            <Radio.Button value="new" style={{ width: '33.33%', textAlign: 'center' }}>
                                {translate('config_word_source_new')}
                            </Radio.Button>
                            <Radio.Button value="mixed" style={{ width: '33.33%', textAlign: 'center' }}>
                                {translate('config_word_source_mixed')}
                            </Radio.Button>
                        </Radio.Group>
                    </Col>

                    <Col xs={24}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <div className={styles.configLabel} style={{ marginBottom: 0 }}>
                                    {translate('config_timer_label', { seconds: TIMER_SECONDS })}
                                </div>
                            </Col>
                            <Col>
                                <Switch checked={timerEnabled} onChange={setTimerEnabled} />
                            </Col>
                        </Row>
                    </Col>

                    <Col xs={24}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <div className={styles.configLabel} style={{ marginBottom: 0 }}>
                                    {translate('config_practice_mode_label')}
                                </div>
                                <div className={styles.configHint}>{translate('config_practice_mode_hint')}</div>
                            </Col>
                            <Col>
                                <Switch checked={practiceMode} onChange={setPracticeMode} />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            <Button type="primary" size="large" block onClick={handleStart} style={{ marginTop: 24 }}>
                {translate('config_start_button')}
            </Button>
        </div>
    );
}
