import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import NextTopLoader from 'nextjs-toploader';
import '@/app/globals.css';
import NextAuthWrapper from '@/library/next.auth.wrapper';
import { AlertProvider } from '@/library/alert.context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'LLsystem',
    description: 'Hệ thống học từ vựng tiếng Trung',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const messages = await getMessages();

    return (
        <html lang="vi">
            <body className={inter.className}>
                <NextTopLoader color="#1677ff" showSpinner={false} />
                <AntdRegistry>
                    <NextAuthWrapper>
                        <NextIntlClientProvider messages={messages}>
                            <AlertProvider>
                                {children}
                            </AlertProvider>
                        </NextIntlClientProvider>
                    </NextAuthWrapper>
                </AntdRegistry>
            </body>
        </html>
    );
}
