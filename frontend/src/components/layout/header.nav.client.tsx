'use client'
import { useState } from 'react';
import { Button, Drawer, Space } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import AccountSettings from './account.settings';
import LocaleSwitcher from './locale.switcher';
import styles from './header.nav.module.css';

interface Props {
    isLoggedIn: boolean;
    userName: string;
    userRole: string;
    userId: string;
    initialName: string;
    initialLearnLang: string;
    initialTransLang: string;
}

export default function HeaderNavClient({
    isLoggedIn,
    userName,
    userRole,
    userId,
    initialName,
    initialLearnLang,
    initialTransLang,
}: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const translate = useTranslations('nav');

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <>
            <Space wrap className={styles.desktopNav}>
                <LocaleSwitcher />
                {isLoggedIn ? (
                    <>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                            {translate('greeting')}, {userName}
                        </span>
                        <Link href="/vocab-practice">
                            <Button size="small">Vocab</Button>
                        </Link>
                        <Link href="/speaking">
                            <Button size="small">Speaking</Button>
                        </Link>
                        {userRole === 'ADMIN' && (
                            <Link href="/dashboard">
                                <Button size="small">{translate('dashboard')}</Button>
                            </Link>
                        )}
                        <AccountSettings
                            userId={userId}
                            initialName={initialName}
                            initialLearnLang={initialLearnLang}
                            initialTransLang={initialTransLang}
                        />
                        <Button size="small" onClick={() => signOut({ callbackUrl: '/' })}>
                            {translate('logout')}
                        </Button>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <Button size="small">{translate('login')}</Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button size="small" type="primary">{translate('register')}</Button>
                        </Link>
                    </>
                )}
            </Space>

            <div className={styles.mobileNav}>
                <Button
                    type="text"
                    icon={<MenuOutlined style={{ fontSize: 20 }} />}
                    onClick={() => setDrawerOpen(true)}
                />
                <Drawer
                    title="LLsystem"
                    placement="right"
                    open={drawerOpen}
                    onClose={closeDrawer}
                    width={260}
                    styles={{ body: { padding: 20 } }}
                >
                    <div className={styles.drawerContent}>
                        {isLoggedIn ? (
                            <>
                                <div className={styles.drawerGreeting}>
                                    {translate('greeting')}, {userName}
                                </div>
                                <Link href="/vocab-practice" onClick={closeDrawer}>
                                    <Button block>Vocab Practice</Button>
                                </Link>
                                <Link href="/speaking" onClick={closeDrawer}>
                                    <Button block>Speaking Coach</Button>
                                </Link>
                                {userRole === 'ADMIN' && (
                                    <Link href="/dashboard" onClick={closeDrawer}>
                                        <Button block>{translate('dashboard')}</Button>
                                    </Link>
                                )}
                                <div className={styles.drawerDivider} />
                                <LocaleSwitcher />
                                <AccountSettings
                                    userId={userId}
                                    initialName={initialName}
                                    initialLearnLang={initialLearnLang}
                                    initialTransLang={initialTransLang}
                                />
                                <Button block danger onClick={() => signOut({ callbackUrl: '/' })}>
                                    {translate('logout')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <LocaleSwitcher />
                                <Link href="/auth/login" onClick={closeDrawer}>
                                    <Button block>{translate('login')}</Button>
                                </Link>
                                <Link href="/auth/register" onClick={closeDrawer}>
                                    <Button block type="primary">{translate('register')}</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </Drawer>
            </div>
        </>
    );
}
