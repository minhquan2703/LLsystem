import { auth } from '@/auth';
import UserTable from '@/components/admin/user.table';
import { sendRequest } from '@/utils/api';

interface IProps {
    searchParams: { current?: string; pageSize?: string; search?: string }
}

const ManageUserPage = async ({ searchParams }: IProps) => {
    const current = searchParams.current ?? 1;
    const pageSize = searchParams.pageSize ?? 10;
    const search = searchParams.search ?? '';
    const session = await auth();

    const res = await sendRequest<IBackendRes<{
        results: IUser[];
        meta: { current: number; pageSize: number; pages: number; total: number }
    }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: 'GET',
        queryParams: {
            current,
            pageSize,
            search,
        },
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        nextOption: {
            next: { tags: ['list-users'] }
        },
    })

    return (
        <div>
            <UserTable
                users={res?.data?.results ?? []}
                meta={res?.data?.meta ?? { current: 1, pageSize: 10, pages: 1, total: 0 }}
            />
        </div>
    )
}

export default ManageUserPage;
