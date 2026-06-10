'use client';
import { useEffect, useState } from 'react';
import { Button, Card, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatPinyin } from '@/utils/pinyin';
import { handleSaveQuizAttemptAction } from '@/utils/actions';
import styles from './page.module.css';

interface AttemptConfig {
    language: QuizLanguage;
    wordSource: QuizWordSource;
    optionCount: number;
}

interface Props {
    questions: IQuizQuestion[];
    direction: QuizDirection;
    timerSeconds: number | null;
    attemptConfig: AttemptConfig;
    practiceMode: boolean;
}

type OptionStatus = 'default' | 'correct' | 'wrong';

//selectedIndex = -1 nghĩa là hết giờ mà chưa chọn đáp án
const TIMEOUT_INDEX = -1;

export default function QuizRunner({ questions, direction, timerSeconds, attemptConfig, practiceMode }: Props) {
    const translate = useTranslations('quiz');
    const [activeQuestions, setActiveQuestions] = useState<IQuizQuestion[]>(questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [wrongQuestions, setWrongQuestions] = useState<IQuizQuestion[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds);

    const isMeaningToZh = direction === 'meaning-to-zh';
    const isAnswered = selectedIndex !== null;

    //đặt lại đồng hồ đếm ngược mỗi khi chuyển câu hoặc làm lại bài
    useEffect(() => {
        setTimeLeft(timerSeconds);
    }, [currentIndex, timerSeconds, activeQuestions]);

    //đếm ngược mỗi giây, hết giờ mà chưa trả lời thì tính là sai
    useEffect(() => {
        if (timerSeconds === null || isAnswered || isFinished || timeLeft === null) {
            return;
        }
        if (timeLeft <= 0) {
            setSelectedIndex(TIMEOUT_INDEX);
            setWrongQuestions((prev) => [...prev, activeQuestions[currentIndex]]);
            return;
        }
        const timeoutId = setTimeout(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : prev)), 1000);
        return () => clearTimeout(timeoutId);
    }, [timeLeft, isAnswered, isFinished, timerSeconds, activeQuestions, currentIndex]);

    if (activeQuestions.length === 0) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                    <h2 style={{ fontWeight: 700 }}>{translate('not_enough_title')}</h2>
                    <p style={{ color: '#6b7280' }}>{translate('not_enough_desc')}</p>
                    <Link href="/words">
                        <Button type="primary">{translate('browse_words')}</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const currentQuestion = activeQuestions[currentIndex];
    const progress = Math.round((currentIndex / activeQuestions.length) * 100);

    const handleSelectOption = (optionIndex: number) => {
        if (isAnswered) {
            return;
        }
        setSelectedIndex(optionIndex);
        if (optionIndex === currentQuestion.correctIndex) {
            setScore((prev) => prev + 1);
        } else {
            setWrongQuestions((prev) => [...prev, currentQuestion]);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= activeQuestions.length) {
            setIsFinished(true);
            if (!practiceMode) {
                handleSaveQuizAttemptAction({
                    direction,
                    language: attemptConfig.language,
                    wordSource: attemptConfig.wordSource,
                    questionCount: activeQuestions.length,
                    optionCount: attemptConfig.optionCount,
                    correctCount: score,
                    wrongWordIds: [...new Set(wrongQuestions.map((question) => question.wordId))],
                }).catch(() => {});
            }
        } else {
            setCurrentIndex((prev) => prev + 1);
            setSelectedIndex(null);
        }
    };

    const restartWith = (nextQuestions: IQuizQuestion[]) => {
        setActiveQuestions(nextQuestions);
        setCurrentIndex(0);
        setSelectedIndex(null);
        setScore(0);
        setWrongQuestions([]);
        setIsFinished(false);
    };

    const getOptionStatus = (optionIndex: number): OptionStatus => {
        if (!isAnswered) {
            return 'default';
        }
        if (optionIndex === currentQuestion.correctIndex) {
            return 'correct';
        }
        if (optionIndex === selectedIndex) {
            return 'wrong';
        }
        return 'default';
    };

    if (isFinished) {
        const percentage = Math.round((score / activeQuestions.length) * 100);
        const isPassed = percentage >= 70;

        return (
            <div className={styles.container}>
                <Card className={styles.resultCard}>
                    <div className={styles.resultIcon}>
                        <TrophyOutlined className={isPassed ? styles.trophyGold : styles.trophyGray} />
                    </div>
                    <div className={styles.resultTitle}>
                        {isPassed ? translate('result_pass_title') : translate('result_fail_title')}
                    </div>
                    <div className={styles.resultScore}>
                        {translate('result_score', { score, total: activeQuestions.length })}
                    </div>
                    <Progress
                        type="circle"
                        percent={percentage}
                        strokeColor={isPassed ? '#16a34a' : '#f59e0b'}
                        style={{ margin: '24px 0' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {wrongQuestions.length > 0 && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => restartWith(wrongQuestions)}
                                block
                            >
                                {translate('retry_wrong', { count: wrongQuestions.length })}
                            </Button>
                        )}
                        <Button
                            type={wrongQuestions.length > 0 ? 'default' : 'primary'}
                            size="large"
                            icon={<ReloadOutlined />}
                            onClick={() => restartWith(questions)}
                            block
                        >
                            {translate('retry_all')}
                        </Button>
                        <Link href="/quiz">
                            <Button type="link" block>{translate('new_quiz')}</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.quizTopBar}>
                <span className={styles.quizProgressLabel}>
                    {translate('question_progress', { current: currentIndex + 1, total: activeQuestions.length })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {timeLeft !== null && (
                        <span className={`${styles.timerLabel} ${timeLeft <= 5 ? styles.timerLabelUrgent : ''}`}>
                            <ClockCircleOutlined /> {timeLeft}s
                        </span>
                    )}
                    <span className={styles.quizScoreLabel}>
                        <CheckCircleOutlined className={styles.scoreIcon} /> {score}
                    </span>
                </span>
            </div>

            <Progress percent={progress} showInfo={false} strokeColor="#1677ff" style={{ marginBottom: 24 }} />

            <Card className={styles.questionCard}>
                {isMeaningToZh ? (
                    <div className={styles.promptMeaning}>{currentQuestion.promptText}</div>
                ) : (
                    <>
                        <div className={styles.wordChinese}>{currentQuestion.promptText}</div>
                        {currentQuestion.promptSub && (
                            <div className={styles.wordPinyin}>{formatPinyin(currentQuestion.promptSub)}</div>
                        )}
                    </>
                )}
            </Card>

            <div className={styles.optionsGrid}>
                {currentQuestion.options.map((option, index) => {
                    const status = getOptionStatus(index);
                    return (
                        <button
                            key={index}
                            className={`${styles.optionButton} ${isMeaningToZh ? styles.optionZh : ''} ${status === 'correct' ? styles.optionCorrect : ''} ${status === 'wrong' ? styles.optionWrong : ''}`}
                            onClick={() => handleSelectOption(index)}
                            disabled={isAnswered}
                        >
                            {status === 'correct' && <CheckCircleOutlined className={styles.optionIcon} />}
                            {status === 'wrong' && <CloseCircleOutlined className={styles.optionIcon} />}
                            {option}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className={styles.feedbackRow}>
                    {selectedIndex === currentQuestion.correctIndex ? (
                        <div className={styles.feedbackCorrect}>{translate('correct_feedback')}</div>
                    ) : (
                        <div className={styles.feedbackWrong}>
                            {selectedIndex === TIMEOUT_INDEX && (
                                <div className={styles.timeUpLabel}>{translate('time_up')}</div>
                            )}
                            {translate('wrong_answer_label')}{' '}
                            <strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong>
                        </div>
                    )}
                    <Button type="primary" size="large" onClick={handleNext}>
                        {currentIndex + 1 >= activeQuestions.length ? translate('see_result') : translate('next_question')}
                    </Button>
                </div>
            )}
        </div>
    );
}
