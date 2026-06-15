'use client'
import { Layout } from 'antd';

const AdminFooter = () => {
    const { Footer } = Layout;

    return (
        <>
            <Footer style={{ textAlign: 'center' }}>
                LLsystem ©{new Date().getFullYear()}
            </Footer>
        </>
    )
}

export default AdminFooter;