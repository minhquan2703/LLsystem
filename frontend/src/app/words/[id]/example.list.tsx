'use client';
import { useState } from 'react';
import { Button } from 'antd';
import { formatPinyin } from '@/utils/pinyin';
import styles from './page.module.css';

interface Props {
    examples: IExample[];
    partsOfSpeech: IPartOfSpeech[];
    locale: string;
    examplesLabel: string;
    showEnglishLabel: string;
    hideEnglishLabel: string;
    showVietnameseLabel: string;
    hideVietnameseLabel: string;
}

export default function ExampleList({
    examples,
    partsOfSpeech,
    locale,
    examplesLabel,
    showEnglishLabel,
    hideEnglishLabel,
    showVietnameseLabel,
    hideVietnameseLabel,
}: Props) {
    const [showSecondary, setShowSecondary] = useState(false);
    const isViLocale = locale === 'vi';

    //build posId → IPartOfSpeech map for O(1) lookup
    const posMap = new Map<number, IPartOfSpeech>(partsOfSpeech.map((pos) => [pos.id, pos]));

    //group examples by partOfSpeechId, unassigned go under key 0
    const groups = new Map<number, IExample[]>();
    for (const example of examples) {
        const key = example.partOfSpeechId ?? 0;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(example);
    }

    //render in partsOfSpeech order, then unassigned last
    const orderedKeys: number[] = [];
    for (const pos of partsOfSpeech) {
        if (groups.has(pos.id)) {
            orderedKeys.push(pos.id);
        }
    }
    if (groups.has(0)) {
        orderedKeys.push(0);
    }

    const getPosLabel = (posId: number): string => {
        const pos = posMap.get(posId);
        if (!pos) {
            return '';
        }
        if (locale === 'vi') {
            return pos.nameVi;
        }
        if (locale === 'zh') {
            return pos.nameZh;
        }
        return pos.nameEn;
    };

    const toggleLabel = isViLocale
        ? showSecondary ? hideEnglishLabel : showEnglishLabel
        : showSecondary ? hideVietnameseLabel : showVietnameseLabel;

    return (
        <div>
            <div className={styles.examplesHeader}>
                <span className={styles.examplesTitle}>{examplesLabel}</span>
                <Button
                    type="link"
                    size="small"
                    onClick={() => setShowSecondary((prev) => !prev)}
                    className={styles.toggleLink}
                >
                    {toggleLabel}
                </Button>
            </div>

            <div className={styles.examples}>
                {orderedKeys.map((posId) => {
                    const groupExamples = groups.get(posId)!;
                    const posLabel = posId !== 0 ? getPosLabel(posId) : null;

                    return (
                        <div key={posId} className={styles.exampleGroup}>
                            {posLabel && (
                                <div className={styles.posGroupHeader}>{posLabel}</div>
                            )}
                            {groupExamples.map((example) => (
                                <div key={example.id} className={styles.example}>
                                    <div className={styles.exampleChinese}>{example.chinese}</div>
                                    {example.pinyin && (
                                        <div className={styles.examplePinyin}>
                                            {formatPinyin(example.pinyin)}
                                        </div>
                                    )}
                                    {isViLocale ? (
                                        <>
                                            {example.vietnamese && (
                                                <div className={styles.exampleTrans}>{example.vietnamese}</div>
                                            )}
                                            {showSecondary && example.english && (
                                                <div className={styles.exampleSecondary}>{example.english}</div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {example.english && (
                                                <div className={styles.exampleTrans}>{example.english}</div>
                                            )}
                                            {showSecondary && example.vietnamese && (
                                                <div className={styles.exampleSecondary}>{example.vietnamese}</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
