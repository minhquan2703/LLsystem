import { auth } from '@/auth'
import ExampleTable from '@/components/admin/example.table'
import { sendRequest } from '@/utils/api'

const ManageExamplePage = async () => {
    const session = await auth()

    const res = await sendRequest<IBackendRes<IExample[]>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/examples`,
        method: 'GET',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        nextOption: { next: { tags: ['list-examples'] } },
    })

    return (
        <div>
            <ExampleTable examples={res?.data ?? []} />
        </div>
    )
}

export default ManageExamplePage