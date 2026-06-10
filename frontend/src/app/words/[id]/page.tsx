import { notFound } from 'next/navigation';
import { Tag, Row, Col, Divider } from 'antd';
import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { sendRequest } from '@/utils/api';
import { formatPinyin, getHskColor } from '@/utils/pinyin';
import AddButton from './add.button';
import ExampleList from './example.list';
import styles from './page.module.css';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function WordDetailPage({ params }: Props) {
    const { id } = await params;
    const [wordRes, session, translate, locale] = await Promise.all([
        sendRequest<IBackendRes<IWord>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words/${id}`,
            method: 'GET',
            nextOption: {
                next: { tags: ['list-words'], revalidate: 3600 }
            },
        }),
        auth(),
        getTranslations('words'),
        getLocale(),
    ]);

    const word = wordRes?.data;
    if (!word) {
        notFound();
    }

    const isLoggedIn = !!session?.user;
    const pinyin = formatPinyin(word.pinyin);

    return (
        <div className={styles.container}>
            <Row gutter={[24, 32]} align="top">
                <Col xs={24} md={9}>
                    <div className={styles.wordCard}>
                        <div className={styles.simplified}>{word.simplified}</div>

                        {word.traditional && word.traditional !== word.simplified && (
                            <div className={styles.traditional}>
                                {word.traditional} ({translate('traditional_label')})
                            </div>
                        )}

                        <div className={styles.row}>
                            {pinyin && <span className={styles.pinyin}>{pinyin}</span>}
                            {word.hanViet && <span className={styles.hanViet}>{word.hanViet}</span>}
                        </div>

                        <div className={styles.badges}>
                            {word.hskLevel && (
                                <Tag color={getHskColor(word.hskLevel)} style={{ fontSize: 14 }}>
                                    HSK {word.hskLevel}
                                </Tag>
                            )}
                            {word.partsOfSpeech?.map((pos) => (
                                <Tag key={pos.id}>
                                    {locale === 'vi' ? pos.nameVi : locale === 'zh' ? pos.nameZh : pos.nameEn}
                                </Tag>
                            ))}
                            {word.topics?.map((topic) => (
                                <Tag key={topic.id} color="geekblue">
                                    {topic.nameVi || topic.name}
                                </Tag>
                            ))}
                        </div>

                        <Divider />

                        <AddButton wordId={word.id} isLoggedIn={isLoggedIn} />
                    </div>
                </Col>

                <Col xs={24} md={15}>
                    {word.vietnameseDef && (
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>{translate('definition_vi')}</div>
                            <div className={styles.sectionContent}>{word.vietnameseDef}</div>
                        </div>
                    )}

                    {word.englishDef && (
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>{translate('definition_en')}</div>
                            <div className={styles.sectionContent}>{word.englishDef}</div>
                        </div>
                    )}

                    {word.examples && word.examples.length > 0 && (
                        <>
                            <Divider />
                            <ExampleList
                                examples={word.examples}
                                partsOfSpeech={word.partsOfSpeech ?? []}
                                locale={locale}
                                examplesLabel={translate('examples_label')}
                                showEnglishLabel={translate('show_english')}
                                hideEnglishLabel={translate('hide_english')}
                                showVietnameseLabel={translate('show_vietnamese')}
                                hideVietnameseLabel={translate('hide_vietnamese')}
                            />
                        </>
                    )}
                </Col>
            </Row>
        </div>
    );
}
