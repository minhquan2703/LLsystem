'use client'
import { handleCreateUserAction } from '@/utils/actions';
import { useAlert } from '@/library/alert.context';
import { Modal, Input, Form, Row, Col, Select } from 'antd';

interface ICreateUserForm {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
}

interface IProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

const ROLE_OPTIONS = [
    { value: 'USER', label: 'Người dùng' },
    { value: 'ADMIN', label: 'Quản trị viên' },
]

const UserCreate = ({ isOpen, setIsOpen }: IProps) => {
    const [form] = Form.useForm<ICreateUserForm>();
    const { alert } = useAlert();

    const handleClose = () => {
        form.resetFields();
        setIsOpen(false);
    }

    const handleSubmitForm = async (values: ICreateUserForm) => {
        const res = await handleCreateUserAction(values);
        if (res?.data) {
            handleClose();
            alert('success', 'Tạo tài khoản thành công');
        } else {
            alert('error', 'Tạo thất bại', String(res?.message));
        }
    }

    return (
        <Modal
            title="Thêm người dùng"
            open={isOpen}
            onOk={() => form.submit()}
            onCancel={handleClose}
            maskClosable={false}
            width={560}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
                <Row gutter={[16, 0]}>
                    <Col xs={24}>
                        <Form.Item
                            label="Họ và tên"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, min: 6, message: 'Ít nhất 6 ký tự' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Vai trò"
                            name="role"
                            initialValue="USER"
                            rules={[{ required: true }]}
                        >
                            <Select options={ROLE_OPTIONS} />
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

export default UserCreate;
