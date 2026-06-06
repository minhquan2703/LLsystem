'use client'
import { handleCreateWordAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col, Select, InputNumber } from 'antd'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
}

const HSK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ value: n, label: `HSK ${n}` }))

const WordCreate = ({ isOpen, setIsOpen }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
    }

    const onFinish = async (values: Partial<Omit<IWord, 'id' | 'createdAt' | 'updatedAt'>>) => {
        const res = await handleCreateWordAction(values)
        if (res?.data) {
            handleClose()
            alert('success', 'Thêm từ thành công')
        } else {
            alert('error', 'Thêm từ thất bại', String(res?.message))
        }
    }

    return (
        <Modal
            title="Thêm từ vựng"
            open={isOpen}
            onOk={() => form.submit()}
            onCancel={handleClose}
            maskClosable={false}
            width={700}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Giản thể"
                            name="simplified"
                            rules={[{ required: true, message: 'Nhập chữ giản thể' }]}
                        >
                            <Input placeholder="学习" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Phồn thể" name="traditional">
                            <Input placeholder="學習 (để trống nếu giống giản thể)" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Pinyin" name="pinyin">
                            <Input placeholder="xue2 xi2" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Hán Việt" name="hanViet">
                            <Input placeholder="học tập" />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Nghĩa tiếng Anh" name="englishDef">
                            <Input.TextArea rows={2} placeholder="to learn / to study" />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Nghĩa tiếng Việt" name="vietnameseDef">
                            <Input.TextArea rows={2} placeholder="để học / để nghiên cứu" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="HSK" name="hskLevel">
                            <Select allowClear placeholder="Chọn cấp" options={HSK_OPTIONS} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Từ loại" name="partOfSpeech">
                            <Input placeholder="noun / verb / adj..." />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Tần suất" name="frequency">
                            <InputNumber style={{ width: '100%' }} min={1} placeholder="1000" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default WordCreate