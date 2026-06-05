'use client'
import { handleUpdateTopicAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col } from 'antd'
import { useEffect } from 'react'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
    data: ITopic | null
    setData: (v: ITopic | null) => void
}

const TopicUpdate = ({ isOpen, setIsOpen, data, setData }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    useEffect(() => {
        if (data) form.setFieldsValue({ name: data.name, nameVi: data.nameVi, description: data.description })
    }, [data])

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
        setData(null)
    }

    const onFinish = async (values: Partial<Omit<ITopic, 'id' | 'createdAt' | 'updatedAt'>>) => {
        if (!data) return
        const res = await handleUpdateTopicAction(data.id, values)
        if (res?.data) {
            handleClose()
            alert('success', 'Cập nhật chủ đề thành công')
        } else {
            alert('error', 'Cập nhật thất bại', String(res?.message))
        }
    }

    return (
        <Modal title="Chỉnh sửa chủ đề" open={isOpen} onOk={() => form.submit()} onCancel={handleClose} maskClosable={false}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tên (tiếng Anh)" name="name" rules={[{ required: true, message: 'Nhập tên chủ đề' }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tên (tiếng Việt)" name="nameVi">
                            <Input />
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

export default TopicUpdate