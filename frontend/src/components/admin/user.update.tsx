'use client'
import { handleUpdateUserAction } from '@/utils/actions';
import { useAlert } from '@/library/alert.context';
import { Modal, Input, Form, Row, Col } from 'antd';
import { useEffect } from 'react';

interface IUpdateUserForm {
    name: string;
    phone?: string;
    address?: string;
}

interface IProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    data: IUser | null;
    setData: (value: IUser | null) => void;
}

const UserUpdate = ({ isOpen, setIsOpen, data, setData }: IProps) => {
    const [form] = Form.useForm<IUpdateUserForm>();
    const { alert } = useAlert();

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                name: data.name,
                phone: data.phone ?? undefined,
                address: data.address ?? undefined,
            });
        }
    }, [data]);

    const handleClose = () => {
        form.resetFields();
        setIsOpen(false);
        setData(null);
    }

    const handleSubmitForm = async (values: IUpdateUserForm) => {
        if (!data) {
            return;
        }
        const res = await handleUpdateUserAction({ id: data.id, ...values });
        if (res?.data) {
            handleClose();
            alert('success', 'Cập nhật thành công');
        } else {
            alert('error', 'Cập nhật thất bại', String(res?.message));
        }
    }

    return (
        <Modal
            title="Cập nhật người dùng"
            open={isOpen}
            onOk={() => form.submit()}
            onCancel={handleClose}
            maskClosable={false}
            width={560}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
                <Row gutter={[16, 0]}>
                    <Col xs={24}>
                        <Form.Item label="Email">
                            <Input value={data?.email} disabled />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Họ và tên"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Số điện thoại" name="phone">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Địa chỉ" name="address">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default UserUpdate;
