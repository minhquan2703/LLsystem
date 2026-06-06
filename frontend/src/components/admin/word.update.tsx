'use client'
import { handleUpdateWordAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { Modal, Input, Form, Row, Col, Select, InputNumber } from 'antd'
import { useEffect } from 'react'

interface IProps {
    isOpen: boolean
    setIsOpen: (v: boolean) => void
    data: IWord | null
    setData: (v: IWord | null) => void
}

const HSK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ value: n, label: `HSK ${n}` }))

const WordUpdate = ({ isOpen, setIsOpen, data, setData }: IProps) => {
    const [form] = Form.useForm()
    const { alert } = useAlert()

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                simplified: data.simplified,
                traditional: data.traditional,
                pinyin: data.pinyin,
                hanViet: data.hanViet,
                englishDef: data.englishDef,
                vietnameseDef: data.vietnameseDef,
                hskLevel: data.hskLevel,
                partOfSpeech: data.partOfSpeech,
                frequency: data.frequency,
            })
        }
    }, [data])

    const handleClose = () => {
        form.resetFields()
        setIsOpen(false)
        setData(null)
    }

    const onFinish = async (values: Partial<Omit<IWord, 'id' | 'createdAt' | 'updatedAt'>>) => {
        if (!data) return
        const res = await handleUpdateWordAction(data.id, values)
        if (res?.data) {
            handleClose()
            alert('success', 'Cập nhật từ thành công')
        } else {
            alert('error', 'Cập nhật thất bại', String(res?.message))
        }
    }

    return (
        <Modal
            title="Chỉnh sửa từ vựng"
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
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Phồn thể" name="traditional">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Pinyin" name="pinyin">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Hán Việt" name="hanViet">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Nghĩa tiếng Anh" name="englishDef">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item label="Nghĩa tiếng Việt" name="vietnameseDef">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="HSK" name="hskLevel">
                            <Select allowClear placeholder="Chọn cấp" options={HSK_OPTIONS} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Từ loại" name="partOfSpeech">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Tần suất" name="frequency">
                            <InputNumber style={{ width: '100%' }} min={1} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default WordUpdate