'use client'
import { handleDeleteWordAction } from '@/utils/actions'
import { useAlert } from '@/library/alert.context'
import { DeleteTwoTone, EditTwoTone, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Select, Table, Tag } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import WordCreate from './word.create'
import WordUpdate from './word.update'

interface IProps {
    words: IWord[]
    meta: {
        current: number
        pageSize: number
        pages: number
        total: number
    }
}

const HSK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ value: String(n), label: `HSK ${n}` }))

const WordTable = ({ words, meta }: IProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isUpdateOpen, setIsUpdateOpen] = useState(false)
    const [dataUpdate, setDataUpdate] = useState<IWord | null>(null)
    const { alert } = useAlert()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

    // reset to page 1 khi đổi filter/search
    const updateFilter = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams)
        params.set('current', '1')
        for (const [key, val] of Object.entries(updates)) {
            if (val) params.set(key, val)
            else params.delete(key)
        }
        replace(`${pathname}?${params.toString()}`)
    }

    const handleSearch = () => updateFilter({ search: searchInput || null })

    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: unknown, __: unknown, index: number) =>
                (index + 1) + (meta.current - 1) * meta.pageSize,
        },
        {
            title: 'Giản thể',
            dataIndex: 'simplified',
            render: (simplified: string, record: IWord) => (
                <span>
                    <span style={{ fontSize: 18 }}>{simplified}</span>
                    {record.traditional && record.traditional !== simplified && (
                        <span style={{ color: '#888', fontSize: 13, marginLeft: 6 }}>({record.traditional})</span>
                    )}
                </span>
            ),
        },
        {
            title: 'Pinyin',
            dataIndex: 'pinyin',
            render: (v: string | null) => v ?? '—',
        },
        {
            title: 'Hán Việt',
            dataIndex: 'hanViet',
            render: (v: string | null) => v ?? '—',
        },
        {
            title: 'Nghĩa EN',
            dataIndex: 'englishDef',
            ellipsis: true,
            render: (v: string | null) => v ?? '—',
        },
        {
            title: 'Nghĩa VI',
            dataIndex: 'vietnameseDef',
            ellipsis: true,
            render: (v: string | null) => v ?? '—',
        },
        {
            title: 'HSK',
            dataIndex: 'hskLevel',
            width: 70,
            render: (v: number | null) => (v ? <Tag>{v}</Tag> : '—'),
        },
        {
            title: 'Thao tác',
            width: 100,
            render: (_: unknown, record: IWord) => (
                <>
                    <EditTwoTone
                        twoToneColor="#f57800"
                        style={{ cursor: 'pointer', marginRight: 16 }}
                        onClick={() => { setDataUpdate(record); setIsUpdateOpen(true) }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa từ?"
                        onConfirm={async () => {
                            const res = await handleDeleteWordAction(record.id)
                            if (res?.statusCode === 200 || res?.statusCode === 201) {
                                alert('success', 'Xóa từ thành công')
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Quản lý từ vựng</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                    Thêm từ
                </Button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Tìm theo giản thể, pinyin, hán việt..."
                    style={{ maxWidth: 320 }}
                    value={searchInput}
                    onChange={e => {
                        setSearchInput(e.target.value)
                        if (!e.target.value) updateFilter({ search: null })
                    }}
                    onPressEnter={handleSearch}
                    suffix={<SearchOutlined style={{ cursor: 'pointer' }} onClick={handleSearch} />}
                    allowClear
                />
                <Select
                    placeholder="HSK cấp..."
                    allowClear
                    style={{ width: 140 }}
                    value={searchParams.get('hskLevel') ?? undefined}
                    onChange={value => updateFilter({ hskLevel: value ?? null })}
                    options={HSK_OPTIONS}
                />
            </div>

            <Table
                bordered
                dataSource={words}
                columns={columns}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} từ`,
                }}
                onChange={pagination => {
                    if (pagination?.current) {
                        const params = new URLSearchParams(searchParams)
                        params.set('current', String(pagination.current))
                        if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize))
                        replace(`${pathname}?${params.toString()}`)
                    }
                }}
            />

            {isCreateOpen && (
                <WordCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            )}
            {isUpdateOpen && dataUpdate && (
                <WordUpdate isOpen={isUpdateOpen} setIsOpen={setIsUpdateOpen} data={dataUpdate} setData={setDataUpdate} />
            )}
        </>
    )
}

export default WordTable
