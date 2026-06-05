'use client'
import { handleDeleteExampleAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { DeleteTwoTone, EditTwoTone, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Table, Tag } from 'antd'
import { useState } from 'react'
import ExampleCreate from './example.create'
import ExampleUpdate from './example.update'

interface IProps {
    examples: IExample[]
}

const ExampleTable = ({ examples }: IProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isUpdateOpen, setIsUpdateOpen] = useState(false)
    const [dataUpdate, setDataUpdate] = useState<IExample | null>(null)
    const { alert } = useAlert()

    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        {
            title: 'Tiếng Trung',
            dataIndex: 'chinese',
            render: (v: string) => <span style={{ fontSize: 16 }}>{v}</span>,
        },
        {
            title: 'Pinyin',
            dataIndex: 'pinyin',
        },
        {
            title: 'Tiếng Việt',
            dataIndex: 'vietnamese',
            ellipsis: true,
        },
        {
            title: 'WordID',
            dataIndex: 'wordId',
            width: 90,
            render: (v: number) => <Tag>{v}</Tag>,
        },
        {
            title: 'Thao tác',
            width: 100,
            render: (_: unknown, record: IExample) => (
                <>
                    <EditTwoTone
                        twoToneColor="#f57800"
                        style={{ cursor: 'pointer', marginRight: 16 }}
                        onClick={() => { setDataUpdate(record); setIsUpdateOpen(true) }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa câu ví dụ?"
                        onConfirm={async () => {
                            const res = await handleDeleteExampleAction(record.id)
                            if (res?.statusCode === 200 || res?.statusCode === 201) {
                                alert('success', 'Xóa câu ví dụ thành công')
                            } else {
                                alert('error', 'Xóa thất bại', String(res?.message))
                            }
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <DeleteTwoTone twoToneColor="#ff4d4f" style={{ cursor: 'pointer' }} />
                    </Popconfirm>
                </>
            ),
        },
    ]

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600 }}>Quản lý câu ví dụ</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                    Thêm câu ví dụ
                </Button>
            </div>
            <Table
                bordered
                dataSource={examples}
                columns={columns}
                rowKey="id"
                scroll={{ x: 700 }}
                pagination={{ pageSize: 10, showTotal: (total) => `${total} câu ví dụ` }}
            />
            <ExampleCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            <ExampleUpdate isOpen={isUpdateOpen} setIsOpen={setIsUpdateOpen} data={dataUpdate} setData={setDataUpdate} />
        </>
    )
}

export default ExampleTable