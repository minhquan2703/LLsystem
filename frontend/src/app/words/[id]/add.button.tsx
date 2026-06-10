'use client';

import { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { handleAddWordToLearningAction } from '@/utils/actions';

interface Props {
    wordId: number;
    isLoggedIn: boolean;
}

export default function AddButton({ wordId, isLoggedIn }: Props) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const translate = useTranslations('words');

    if (!isLoggedIn) {
        return (
            <Button href="/auth/login" type="primary" icon={<PlusOutlined />} size="large">
                {translate('login_to_add')}
            </Button>
        );
    }

    if (added) {
        return (
            <Button type="default" icon={<CheckOutlined />} size="large" disabled>
                {translate('added_to_list')}
            </Button>
        );
    }

    const handleAdd = async () => {
        setLoading(true);
        try {
            const res = await handleAddWordToLearningAction(wordId);
            if (res?.statusCode === 201 || res?.statusCode === 200) {
                setAdded(true);
                message.success(translate('add_success'));
            } else {
                message.error(res?.message ?? translate('add_error'));
            }
        } catch {
            message.error(translate('add_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            loading={loading}
            onClick={handleAdd}
        >
            {translate('add_to_list')}
        </Button>
    );
}
