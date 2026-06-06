'use client'
import { switchLocaleAction } from '@/utils/actions';
import type { Locale } from '@/i18n/request';
import { Button, Space } from 'antd';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

const LOCALE_LABELS: Record<Locale, string> = {
    vi: 'VI',
    en: 'EN',
    zh: '中',
}

const ALL_LOCALES: Locale[] = ['vi', 'en', 'zh'];

export default function LocaleSwitcher() {
    const currentLocale = useLocale() as Locale;
    const router = useRouter();

    const handleSwitch = async (targetLocale: Locale) => {
        if (targetLocale === currentLocale) {
            return;
        }
        await switchLocaleAction(targetLocale);
        router.refresh();
    }

    return (
        <Space size={4}>
            {ALL_LOCALES.map(locale => (
                <Button
                    key={locale}
                    size="small"
                    type={currentLocale === locale ? 'primary' : 'text'}
                    onClick={() => handleSwitch(locale)}
                >
                    {LOCALE_LABELS[locale]}
                </Button>
            ))}
        </Space>
    )
}
