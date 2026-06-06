'use client'
import { handleDeleteUserAction } from '@/utils/actions';
import { useAlert } from '@/library/alert.context';
import { DeleteTwoTone, EditTwoTone, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Table, Tag } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import UserCreate from './user.create';
import UserUpdate from './user.update';

interface IProps {
    users: IUser[];
    meta: {
        current: number;
        pageSize: number;
        pages: number;
        total: number;
    }
}

const UserTable = ({ users, meta }: IProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IUser | null>(null);
    const { alert } = useAlert();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

    const updateFilter = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams);
        params.set('current', '1');
        for (const [key, value] of Object.entries(updates)) {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }
        replace(`${pathname}?${params.toString()}`);
    }

    const handleSearch = () => updateFilter({ search: searchInput || null });

    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: unknown, __: unknown, index: number) =>
                (index + 1) + (meta.current - 1) * meta.pageSize,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            width: 130,
            render: (role: string) => (
                <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            width: 110,
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'default'}>
                    {isActive ? 'Hoạt động' : 'Chưa kích hoạt'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            width: 100,
            render: (_: unknown, record: IUser) => (
                <>
                    <EditTwoTone
                        twoToneColor="#f57800"
                        style={{ cursor: 'pointer', marginRight: 16 }}
                        onClick={() => { setDataUpdate(record); setIsUpdateOpen(true); }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa người dùng?"
                        onConfirm={async () => {
                            const res = await handleDeleteUserAction(record.id);
                            if (res?.statusCode === 200 || res?.statusCode === 201) {
                                alert('success', 'Xóa thành công');
                            } else {
                                alert('error', 'Xóa thất bại', String(res?.message));
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
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Quản lý người dùng</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                    Thêm người dùng
                </Button>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm theo tên, email..."
                    style={{ maxWidth: 320 }}
                    value={searchInput}
                    onChange={e => {
                        setSearchInput(e.target.value);
                        if (!e.target.value) {
                            updateFilter({ search: null });
                        }
                    }}
                    onPressEnter={handleSearch}
                    suffix={<SearchOutlined style={{ cursor: 'pointer' }} onClick={handleSearch} />}
                    allowClear
                />
            </div>

            <Table
                bordered
                dataSource={users}
                columns={columns}
                rowKey="id"
                scroll={{ x: 700 }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} người dùng`,
                }}
                onChange={pagination => {
                    if (pagination?.current) {
                        const params = new URLSearchParams(searchParams);
                        params.set('current', String(pagination.current));
                        if (pagination.pageSize) {
                            params.set('pageSize', String(pagination.pageSize));
                        }
                        replace(`${pathname}?${params.toString()}`);
                    }
                }}
            />

            {isCreateOpen && (
                <UserCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            )}
            {isUpdateOpen && dataUpdate && (
                <UserUpdate isOpen={isUpdateOpen} setIsOpen={setIsUpdateOpen} data={dataUpdate} setData={setDataUpdate} />
            )}
        </>
    )
}

export default UserTable;
