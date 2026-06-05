'use client'
import { handleCreateTopicAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col } from 'antd'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
}

const TopicCreate = ({ isOpen, setIsOpen }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
    }

    const onFinish = async (values: Omit<ITopic, 'id' | 'createdAt' | 'updatedAt'>) => {
        const res = await handleCreateTopicAction(values)
        if (res?.data) {
            handleClose()
            alert('success', 'Tạo chủ đề thành công')
        } else {
            alert('error', 'Tạo chủ đề thất bại', String(res?.message))
        }
    }

    return (
        <Modal title="Thêm chủ đề" open={isOpen} onOk={() => form.submit()} onCancel={handleClose} maskClosable={false}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tên (tiếng Anh)" name="name" rules={[{ required: true, message: 'Nhập tên chủ đề' }]}>
                            <Input placeholder="Family" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tên (tiếng Việt)" name="nameVi">
                            <Input placeholder="Gia đình" />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Mô tả" name="description">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default TopicCreate