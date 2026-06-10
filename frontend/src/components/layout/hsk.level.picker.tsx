'use client';

import { useState } from 'react';
import { Card, Spin, Tag, message } from 'antd';
import { useTranslations } from 'next-intl';
import { handleUpdateHskLevelAction } from '@/utils/actions';
import { getHskColor } from '@/utils/pinyin';
import styles from './hsk.level.picker.module.css';

const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
    currentLevel: number | null;
}

export default function HskLevelPicker({ currentLevel }: Props) {
    const [level, setLevel] = useState(currentLevel);
    const [savingLevel, setSavingLevel] = useState<number | null>(null);
    const translate = useTranslations('dashboard');

    const handlePick = async (pickedLevel: number) => {
        if (pickedLevel === level || savingLevel !== null) {
            return;
        }
        setSavingLevel(pickedLevel);
        try {
            const res = await handleUpdateHskLevelAction(pickedLevel);
            if (res?.statusCode === 200 || res?.statusCode === 201) {
                setLevel(pickedLevel);
                message.success(translate('hsk_level_save_success', { level: pickedLevel }));
            } else {
                message.error(res?.message ?? translate('hsk_level_save_error'));
            }
        } catch {
            message.error(translate('hsk_level_save_error'));
        } finally {
            setSavingLevel(null);
        }
    };

    return (
        <Card className={styles.card}>
            <div className={styles.label}>
                {level ? translate('hsk_level_current', { level }) : translate('hsk_level_prompt')}
            </div>
            <div className={styles.levelRow}>
                {HSK_LEVELS.map((item) => (
                    <Tag
                        key={item}
                        color={getHskColor(item)}
                        className={level === item ? `${styles.levelTag} ${styles.levelTagActive}` : styles.levelTag}
                        onClick={() => handlePick(item)}
                    >
                        {savingLevel === item ? <Spin size="small" /> : `HSK ${item}`}
                    </Tag>
                ))}
            </div>
        </Card>
    );
}
