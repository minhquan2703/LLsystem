import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export type Locale = 'vi' | 'en' | 'zh';
export const LOCALES: Locale[] = ['vi', 'en', 'zh'];
export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export default getRequestConfig(async () => {
    const rawLocale = cookies().get(LOCALE_COOKIE)?.value;
    const locale: Locale = LOCALES.includes(rawLocale as Locale) ? (rawLocale as Locale) : DEFAULT_LOCALE;

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
