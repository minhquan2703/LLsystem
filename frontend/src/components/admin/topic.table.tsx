'use client'
import { handleDeleteTopicAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { DeleteTwoTone, EditTwoTone, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Table } from 'antd'
import { useState } from 'react'
import TopicCreate from './topic.create'
import TopicUpdate from './topic.update'

interface IProps {
    topics: ITopic[]
}

const TopicTable = ({ topics }: IProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isUpdateOpen, setIsUpdateOpen] = useState(false)
    const [dataUpdate, setDataUpdate] = useState<ITopic | null>(null)
    const { alert } = useAlert()

    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        {
            title: 'Tên (EN)',
            dataIndex: 'name',
        },
        {
            title: 'Tên (VI)',
            dataIndex: 'nameVi',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            width: 100,
            render: (_: unknown, record: ITopic) => (
                <>
                    <EditTwoTone
                        twoToneColor="#f57800"
                        style={{ cursor: 'pointer', marginRight: 16 }}
                        onClick={() => { setDataUpdate(record); setIsUpdateOpen(true) }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa chủ đề?"
                        onConfirm={async () => {
                            const res = await handleDeleteTopicAction(record.id)
                            if (res?.statusCode === 200 || res?.statusCode === 201) {
                                alert('success', 'Xóa chủ đề thành công')
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
                <span style={{ fontWeight: 600 }}>Quản lý chủ đề</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                    Thêm chủ đề
                </Button>
            </div>
            <Table
                bordered
                dataSource={topics}
                columns={columns}
                rowKey="id"
                scroll={{ x: 600 }}
                pagination={{ pageSize: 10, showTotal: (total) => `${total} chủ đề` }}
            />
            {isCreateOpen && (
                <TopicCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            )}
            {isUpdateOpen && dataUpdate && (
                <TopicUpdate isOpen={isUpdateOpen} setIsOpen={setIsUpdateOpen} data={dataUpdate} setData={setDataUpdate} />
            )}
        </>
    )
}

export default TopicTable