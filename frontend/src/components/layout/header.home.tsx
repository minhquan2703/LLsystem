import { auth, signOut } from '@/auth'
import { Button, Space } from 'antd'
import Link from 'next/link'

export default async function HeaderHome() {
  const session = await auth()

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontWeight: 600, fontSize: 18 }}>LLsystem</span>
      <Space>
        {session ? (
          <>
            <span>Xin chào, {session.user?.name}</span>
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}>
              <Button htmlType="submit">Đăng xuất</Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/login"><Button>Đăng nhập</Button></Link>
            <Link href="/auth/register"><Button type="primary">Đăng ký</Button></Link>
          </>
        )}
      </Space>
    </header>
  )
}
