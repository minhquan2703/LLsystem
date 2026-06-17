'use server'

import { auth, signIn } from '@/auth';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { sendRequest } from '@/utils/api';
import { LOCALE_COOKIE, LOCALES, type Locale } from '@/i18n/request';

// ── Locale ────────────────────────────────────────────────────────────────────

export const switchLocaleAction = async (locale: Locale) => {
    if (!LOCALES.includes(locale)) {
        return;
    }
    cookies().set(LOCALE_COOKIE, locale, { maxAge: 365 * 24 * 60 * 60, path: '/' });
}


export async function authenticate(username: string, password: string) {
    try {
        const r = await signIn("credentials", {
            username: username,
            password: password,
            // callbackUrl: "/",
            redirect: false,
        })
        console.log(">>> check r: ", r)
        return r;
    } catch (error) {
        if ((error as any).name === "InvalidEmailPasswordError") {
            return {
                error: (error as any).type,
                code: 1
            }

        } else if ((error as any).name === "InactiveAccountError") {
            return {
                error: (error as any).type,
                code: 2
            }
        } else {
            return {
                error: "Internal server error",
                code: 0
            }
        }

    }
}

export const handleCreateUserAction = async (data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { password: string }) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: { ...data },
    })
    revalidateTag('list-users')
    return res;
}

export const handleUpdateUserAction = async (data: Partial<IUser> & { id: string }) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag('list-users')
    revalidateTag('user-profile')
    return res;
}

export const handleUpdateHskLevelAction = async (hskLevel: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: {
            id: session?.user?._id,
            hskLevel,
        },
    })
    revalidateTag('user-profile')
    return res;
}

export const handleDeleteUserAction = async (id: string) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<unknown>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${id}`,
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    })
    revalidateTag('list-users')
    return res;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export const handleAddWordToLearningAction = async (wordId: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IUserWord>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/add`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: { wordId },
    })
    return res;
}

export const handleSubmitWordReviewAction = async (userWordId: number, quality: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IReviewResult>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/review`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: { userWordId, quality },
    })
    return res;
}

export const handleUnsuspendWordAction = async (userWordId: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IUserWord>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/learning/${userWordId}/unsuspend`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    })
    return res;
}

export const handleSaveQuizAttemptAction = async (data: {
    direction: QuizDirection;
    language: QuizLanguage;
    wordSource: QuizWordSource;
    questionCount: number;
    optionCount: number;
    correctCount: number;
    wrongWordIds?: number[];
}) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IQuizAttempt>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quiz/attempts`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: data,
    })
    return res;
}

// ── Speaking ─────────────────────────────────────────────────────────────────

export const handleSubmitSpeakingAttemptAction = async (data: {
    questionId: number;
    audioBase64: string;
    mimeType: string;
    durationSeconds: number;
    pauseCount: number;
    totalPauseSeconds: number;
    longPauseCount: number;
    speechRatio?: number;
}) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<ISpeakingAttempt>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/speaking/attempts`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: data,
    })
    revalidateTag('speaking-attempts')
    return res;
}

export const handleGetSpeakingAttemptAction = async (id: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<ISpeakingAttempt>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/speaking/attempts/${id}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    });
    return res;
};

export const handleDeleteSpeakingAttemptAction = async (id: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<{ id: number }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/speaking/attempts/${id}`,
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    })
    revalidateTag('speaking-attempts')
    return res;
}

// ── Vocab Practice ────────────────────────────────────────────────────────────

export const handleStartVocabRunAction = async (data: {
    mode?: PracticeMode;
    targetTopic?: string;
    sessionCount?: number;
}) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IStartRunResponse>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/runs`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: data,
    })
    return res;
}

export const handleFinishVocabRunEarlyAction = async () => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<null>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/runs/finish`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    });
    revalidateTag('vocab-history');
    return res;
};

export const handleResumeRunAction = async (runId: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<null>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/runs/${runId}/resume`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    });
    revalidateTag('vocab-history');
    return res;
};

export const handleSaveDraftAction = async (
    sessionId: number,
    answers: Array<{ senseId: number; synonymsInput: string[]; exampleInput: string }>,
    currentSenseIndex: number,
) => {
    const session = await auth();
    await sendRequest<IBackendRes<null>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/sessions/${sessionId}/draft`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: {
            answers,
            currentSenseIndex,
        },
    });
};

export const handleSubmitVocabSessionAction = async (
    sessionId: number,
    attempts: Array<{
        senseId: number;
        synonymsInput: string[];
        exampleInput?: string;
    }>,
) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<ISubmitSessionResponse>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/vocab-practice/sessions/${sessionId}/submit`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: { attempts },
    })
    return res;
}

// ── Topics ──────────────────────────────────────────────────────────────────

export const handleCreateTopicAction = async (data: Omit<ITopic, 'id' | 'createdAt' | 'updatedAt'>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<ITopic>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag("list-topics")
    return res;
}

export const handleUpdateTopicAction = async (id: number, data: Partial<Omit<ITopic, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<ITopic>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics/${id}`,
        method: "PATCH",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag("list-topics")
    return res;
}

export const handleDeleteTopicAction = async (id: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<unknown>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics/${id}`,
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
    })
    revalidateTag("list-topics")
    return res;
}

// ── Examples ─────────────────────────────────────────────────────────────────

export const handleCreateExampleAction = async (data: Omit<IExample, 'id' | 'createdAt'>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IExample>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/examples`,
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag("list-examples")
    return res;
}

export const handleUpdateExampleAction = async (id: number, data: Partial<Omit<IExample, 'id' | 'createdAt'>>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IExample>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/examples/${id}`,
        method: "PATCH",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag("list-examples")
    return res;
}

export const handleDeleteExampleAction = async (id: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<unknown>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/examples/${id}`,
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
    })
    revalidateTag("list-examples")
    return res;
}

// ── Words ─────────────────────────────────────────────────────────────────────

export const handleCreateWordAction = async (data: Partial<Omit<IWord, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IWord>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words`,
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag('list-words')
    return res;
}

export const handleUpdateWordAction = async (id: number, data: Partial<Omit<IWord, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<IWord>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words/${id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        body: { ...data },
    })
    revalidateTag('list-words')
    return res;
}

export const handleDeleteWordAction = async (id: number) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<unknown>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/words/${id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
    })
    revalidateTag('list-words')
    return res;
}
