'use client'

import { handleUpdateUserAction } from '@/utils/actions';
import { Button, Form, Input, Modal, Select, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface IProps {
    userId: string;
    initialName: string;
    initialLearnLang: string;
    initialTransLang: string;
}

export default function AccountSettings({ userId, initialName, initialLearnLang, initialTransLang }: IProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();
    const translate = useTranslations('account');

    const handleOpen = () => {
        form.setFieldsValue({
            name: initialName,
            learnLang: initialLearnLang,
            transLang: initialTransLang,
        });
        setIsOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsSubmitting(true);
            const res = await handleUpdateUserAction({ id: userId, ...values });
            if (res?.data) {
                message.success(translate('save_success'));
                setIsOpen(false);
            } else {
                message.error(res?.message ?? translate('save_error'));
            }
        } catch {
            //form validation error — antd tự hiển thị inline
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button size="small" onClick={handleOpen}>
                {translate('button')}
            </Button>
            {isOpen && (
                <Modal
                    title={translate('title')}
                    open={isOpen}
                    onCancel={() => setIsOpen(false)}
                    onOk={handleSubmit}
                    okText={translate('save')}
                    cancelText={translate('cancel')}
                    confirmLoading={isSubmitting}
                >
                    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item
                            name="name"
                            label={translate('name')}
                            rules={[{ required: true, message: translate('name_required') }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="learnLang" label={translate('learn_lang')}>
                            <Select
                                options={[
                                    { value: 'zh', label: translate('lang_zh') },
                                    { value: 'en', label: translate('lang_en') },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="transLang" label={translate('trans_lang')}>
                            <Select
                                options={[
                                    { value: 'vi', label: translate('lang_vi') },
                                    { value: 'en', label: translate('lang_en') },
                                    { value: 'zh', label: translate('lang_zh') },
                                ]}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </>
    );
}
