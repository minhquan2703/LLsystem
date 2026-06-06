'use client'
import Layout from 'antd/es/layout'
import Menu from 'antd/es/menu'
import {
    AppstoreOutlined,
    FileTextOutlined,
    TagsOutlined,
    TeamOutlined,
    TranslationOutlined,
} from '@ant-design/icons'
import { useContext } from 'react'
import { AdminContext } from '@/library/admin.context'
import type { MenuProps } from 'antd'
import Link from 'next/link'

type MenuItem = Required<MenuProps>['items'][number]

const AdminSideBar = () => {
    const { Sider } = Layout
    const { collapseMenu } = useContext(AdminContext)!

    const items: MenuItem[] = [
        {
            key: 'grp',
            label: 'LLsystem',
            type: 'group',
            children: [
                {
                    key: 'dashboard',
                    label: <Link href="/dashboard">Dashboard</Link>,
                    icon: <AppstoreOutlined />,
                },
                {
                    key: 'users',
                    label: <Link href="/dashboard/user">Người dùng</Link>,
                    icon: <TeamOutlined />,
                },
                {
                    key: 'words',
                    label: <Link href="/dashboard/product">Từ vựng</Link>,
                    icon: <TranslationOutlined />,
                },
                {
                    key: 'topics',
                    label: <Link href="/dashboard/topic">Chủ đề</Link>,
                    icon: <TagsOutlined />,
                },
                {
                    key: 'examples',
                    label: <Link href="/dashboard/example">Câu ví dụ</Link>,
                    icon: <FileTextOutlined />,
                },
            ],
        },
    ]

    return (
        <Sider collapsed={collapseMenu}>
            <Menu
                mode="inline"
                defaultSelectedKeys={['dashboard']}
                items={items}
                style={{ height: '100vh' }}
            />
        </Sider>
    )
}

export default AdminSideBar