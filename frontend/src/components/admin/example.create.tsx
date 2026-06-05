'use client'
import { handleCreateExampleAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col, InputNumber } from 'antd'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
}

const ExampleCreate = ({ isOpen, setIsOpen }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
    }

    const onFinish = async (values: Omit<IExample, 'id' | 'createdAt'>) => {
        const res = await handleCreateExampleAction(values)
        if (res?.data) {
            handleClose()
            alert('success', 'Tạo câu ví dụ thành công')
        } else {
            alert('error', 'Tạo câu ví dụ thất bại', String(res?.message))
        }
    }

    return (
        <Modal title="Thêm câu ví dụ" open={isOpen} onOk={() => form.submit()} onCancel={handleClose} maskClosable={false}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tiếng Trung" name="chinese" rules={[{ required: true, message: 'Nhập câu tiếng Trung' }]}>
                            <Input placeholder="我爱我的家人。" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Pinyin" name="pinyin">
                            <Input placeholder="Wǒ ài wǒ de jiārén." />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tiếng Anh" name="english">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tiếng Việt" name="vietnamese">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="ID từ vựng (wordId)" name="wordId" rules={[{ required: true, message: 'Nhập wordId' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default ExampleCreate