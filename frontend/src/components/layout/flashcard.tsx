'use client'
import { handleSubmitWordReviewAction } from '@/utils/actions';
import { Button, notification, Space, Tag } from 'antd';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import styles from './flashcard.module.css';

interface IProps {
    words: IUserWord[];
}

export default function Flashcard({ words }: IProps) {
    //dùng queue thay vì index cố định để hỗ trợ re-queue khi againToday=true
    const [reviewQueue, setReviewQueue] = useState<IUserWord[]>([...words]);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notificationApi, notificationContext] = notification.useNotification();
    const translate = useTranslations('flashcard');

    const originalCount = words.length;
    const uniqueRemainingIds = new Set(reviewQueue.map((userWord) => userWord.id));
    const completedCount = originalCount - uniqueRemainingIds.size;
    const progressPercent = originalCount > 0 ? (completedCount / originalCount) * 100 : 0;

    if (words.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <h2 style={{ fontWeight: 700 }}>{translate('no_due_title')}</h2>
                <p style={{ color: '#6b7280' }}>{translate('no_due_desc')}</p>
                <Link href="/">
                    <Button type="primary">{translate('back_home')}</Button>
                </Link>
            </div>
        );
    }

    if (reviewQueue.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <h2 style={{ fontWeight: 700 }}>{translate('completed_title')}</h2>
                <p style={{ color: '#6b7280' }}>{translate('completed_desc')}</p>
                <Link href="/">
                    <Button type="primary">{translate('back_home')}</Button>
                </Link>
            </div>
        );
    }

    const currentUserWord = reviewQueue[0];
    const currentWord = currentUserWord.word;

    const handleFlip = () => {
        if (!isSubmitting) {
            setIsFlipped((flipped) => !flipped);
        }
    };

    const handleQualitySubmit = async (quality: number) => {
        setIsSubmitting(true);
        const res = await handleSubmitWordReviewAction(currentUserWord.id, quality);
        setIsSubmitting(false);
        setReviewedCount((count) => count + 1);

        const result = res?.data;
        const remainingQueue = reviewQueue.slice(1);

        if (result?.againToday) {
            //từ cần ôn lại ngay hôm nay — đẩy ra cuối queue
            setReviewQueue([...remainingQueue, currentUserWord]);
        } else {
            setReviewQueue(remainingQueue);
        }

        if (result?.isLeech) {
            notificationApi.warning({
                message: `"${currentWord.simplified}" đã bị tạm dừng`,
                description: 'Từ bị quên quá nhiều lần. Bạn có thể bỏ tạm dừng từ màn hình thống kê.',
                duration: 6,
            });
        }

        setIsFlipped(false);
    };

    return (
        <>
            {notificationContext}
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>
                        {translate('progress', { done: completedCount + 1, total: originalCount })}
                    </div>
                    {reviewQueue.length > originalCount - completedCount && (
                        <Tag color="orange" style={{ fontSize: 12 }}>
                            +{reviewQueue.length - (originalCount - completedCount)} cần ôn lại
                        </Tag>
                    )}
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                </div>

                <div className={styles.cardWrapper}>
                    <div
                        className={`${styles.card} ${isFlipped ? styles.cardFlipped : ''}`}
                        onClick={handleFlip}
                        style={{ minHeight: 280 }}
                    >
                        {/* mặt trước: chữ hán + pinyin */}
                        <div className={styles.cardFace}>
                            <div style={{ fontSize: 'clamp(48px, 10vw, 72px)', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                                {currentWord.simplified}
                            </div>
                            {currentWord.traditional && currentWord.traditional !== currentWord.simplified && (
                                <div style={{ fontSize: 20, color: '#6b7280', marginTop: 8 }}>
                                    {currentWord.traditional}
                                </div>
                            )}
                            {currentWord.pinyin && (
                                <div style={{ fontSize: 18, color: '#1677ff', marginTop: 12 }}>
                                    {currentWord.pinyin}
                                </div>
                            )}
                            <div className={styles.hintText}>{translate('tap_to_reveal')}</div>
                        </div>

                        {/* mặt sau: nghĩa */}
                        <div className={`${styles.cardFace} ${styles.cardBack}`}>
                            {currentWord.hanViet && (
                                <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 8 }}>
                                    {currentWord.hanViet}
                                </div>
                            )}
                            {currentWord.vietnameseDef && (
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', textAlign: 'center', marginBottom: 8 }}>
                                    {currentWord.vietnameseDef}
                                </div>
                            )}
                            {currentWord.englishDef && (
                                <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                                    {currentWord.englishDef}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isFlipped && (
                    <Space wrap style={{ marginTop: 24, justifyContent: 'center', width: '100%', display: 'flex' }}>
                        <Button
                            onClick={() => handleQualitySubmit(0)}
                            loading={isSubmitting}
                            style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                        >
                            {translate('forgot')}
                        </Button>
                        <Button
                            onClick={() => handleQualitySubmit(2)}
                            loading={isSubmitting}
                            style={{ borderColor: '#f97316', color: '#f97316' }}
                        >
                            {translate('hard')}
                        </Button>
                        <Button
                            onClick={() => handleQualitySubmit(4)}
                            loading={isSubmitting}
                            style={{ borderColor: '#1677ff', color: '#1677ff' }}
                        >
                            {translate('remembered')}
                        </Button>
                        <Button
                            onClick={() => handleQualitySubmit(5)}
                            loading={isSubmitting}
                            style={{ borderColor: '#16a34a', color: '#16a34a' }}
                        >
                            {translate('mastered')}
                        </Button>
                    </Space>
                )}
            </div>
        </>
    );
}
