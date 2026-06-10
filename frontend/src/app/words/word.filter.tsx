'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input, Select, Row, Col, Pagination } from 'antd';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import styles from './page.module.css';

const HSK_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface Props {
    topics: ITopic[];
    meta?: { current: number; pageSize: number; pages: number; total: number };
    paginationOnly?: boolean;
}

export default function WordFilter({ topics, meta, paginationOnly = false }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const translate = useTranslations('words');

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });
            //reset về trang 1 khi đổi filter
            if (!('current' in updates)) {
                params.delete('current');
            }
            router.replace(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams],
    );

    const hskOptions = [
        { value: '', label: translate('all_levels') },
        ...HSK_LEVELS.map((level) => ({ value: level, label: `HSK ${level}` })),
    ];

    const topicOptions = [
        { value: '', label: translate('all_topics') },
        ...topics.map((topic) => ({ value: String(topic.id), label: topic.nameVi || topic.name })),
    ];

    const filterRow = !paginationOnly ? (
        <Row gutter={[12, 12]} className={styles.filterRow}>
            <Col xs={24} md={10}>
                <Input.Search
                    placeholder={translate('search_placeholder')}
                    defaultValue={searchParams.get('search') ?? ''}
                    onSearch={(value) => updateParams({ search: value })}
                    onChange={(e) => {
                        if (!e.target.value) {
                            updateParams({ search: '' });
                        }
                    }}
                    allowClear
                />
            </Col>
            <Col xs={12} md={7}>
                <Select
                    options={hskOptions}
                    value={searchParams.get('hskLevel') ?? ''}
                    onChange={(value) => updateParams({ hskLevel: value })}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col xs={12} md={7}>
                <Select
                    options={topicOptions}
                    value={searchParams.get('topicId') ?? ''}
                    onChange={(value) => updateParams({ topicId: value })}
                    style={{ width: '100%' }}
                />
            </Col>
        </Row>
    ) : null;

    const paginationRow = meta && meta.total > meta.pageSize ? (
        <div className={styles.paginationRow}>
            <Pagination
                current={meta.current}
                pageSize={meta.pageSize}
                total={meta.total}
                showTotal={(total) => translate('total_count', { total })}
                onChange={(page) => updateParams({ current: String(page) })}
                showSizeChanger={false}
            />
        </div>
    ) : null;

    return (
        <>
            {filterRow}
            {paginationRow}
        </>
    );
}
