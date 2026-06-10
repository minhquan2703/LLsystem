import Link from 'next/link';
import { Tag } from 'antd';
import { formatPinyin, getHskColor } from '@/utils/pinyin';
import styles from './page.module.css';

interface Props {
    word: IWord;
}

export default function WordCard({ word }: Props) {
    const primaryTopic = word.topics?.[0];

    return (
        <Link href={`/words/${word.id}`} className={styles.card}>
            <div className={styles.cardSimplified}>{word.simplified}</div>

            {word.pinyin && (
                <div className={styles.cardPinyin}>{formatPinyin(word.pinyin)}</div>
            )}

            {word.hanViet && (
                <div className={styles.cardHanViet}>{word.hanViet}</div>
            )}

            <div className={styles.cardDef}>
                {word.vietnameseDef ?? word.englishDef ?? '—'}
            </div>

            <div className={styles.cardFooter}>
                {word.hskLevel && (
                    <Tag color={getHskColor(word.hskLevel)}>HSK {word.hskLevel}</Tag>
                )}
                {primaryTopic && (
                    <Tag>{primaryTopic.nameVi || primaryTopic.name}</Tag>
                )}
            </div>
        </Link>
    );
}
