import { auth } from '@/auth'
import TopicTable from '@/components/admin/topic.table'
import { sendRequest } from '@/utils/api'

const ManageTopicPage = async () => {
    const session = await auth()

    const res = await sendRequest<IBackendRes<ITopic[]>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
        method: 'GET',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        nextOption: { next: { tags: ['list-topics'] } },
    })

    return (
        <div>
            <TopicTable topics={res?.data ?? []} />
        </div>
    )
}

export default ManageTopicPage