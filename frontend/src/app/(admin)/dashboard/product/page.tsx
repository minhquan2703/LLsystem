import { auth } from '@/auth'
import WordTable from '@/components/admin/word.table'
import { sendRequest } from '@/utils/api'

interface IProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

const ManageWordPage = async ({ searchParams }: IProps) => {
    const current = searchParams?.current ?? 1
    const pageSize = searchParams?.pageSize ?? 10
    const search = searchParams?.search
    const hskLevel = searchParams?.hskLevel
    const session = await auth()

    const res = await sendRequest<IBackendRes<{ meta: { current: number; pageSize: number; pages: number; total: number }; results: IWord[] }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words`,
        method: 'GET',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        queryParams: {
            current,
            pageSize,
            ...(search && { search }),
            ...(hskLevel && { hskLevel }),
        },
        nextOption: { next: { tags: ['list-words'] } },
    })

    return (
        <div>
            <WordTable
                words={res?.data?.results ?? []}
                meta={res?.data?.meta ?? { current: 1, pageSize: 10, pages: 0, total: 0 }}
            />
        </div>
    )
}

export default ManageWordPage
