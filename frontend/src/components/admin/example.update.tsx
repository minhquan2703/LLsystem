'use client'
import { handleUpdateExampleAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col } from 'antd'
import { useEffect } from 'react'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
    data: IExample | null
    setData: (v: IExample | null) => void
}

const ExampleUpdate = ({ isOpen, setIsOpen, data, setData }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    useEffect(() => {
        if (data) form.setFieldsValue({
            chinese: data.chinese,
            pinyin: data.pinyin,
            english: data.english,
            vietnamese: data.vietnamese,
        })
    }, [data])

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
        setData(null)
    }

    const onFinish = async (values: Partial<Omit<IExample, 'id' | 'createdAt' | 'wordId'>>) => {
        if (!data) return
        const res = await handleUpdateExampleAction(data.id, values)
        if (res?.data) {
            handleClose()
            alert('success', 'Cập nhật câu ví dụ thành công')
        } else {
            alert('error', 'Cập nhật thất bại', String(res?.message))
        }
    }

    return (
        <Modal title="Chỉnh sửa câu ví dụ" open={isOpen} onOk={() => form.submit()} onCancel={handleClose} maskClosable={false}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Tiếng Trung" name="chinese" rules={[{ required: true, message: 'Nhập câu tiếng Trung' }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Pinyin" name="pinyin">
                            <Input />
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
                </Row>
            </Form>
        </Modal>
    )
}

export default ExampleUpdate