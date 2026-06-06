export { };
// https://bobbyhadz.com/blog/typescript-make-types-global#declare-global-types-in-typescript

declare global {
    interface IRequest {
        url: string;
        method: string;
        body?: { [key: string]: any };
        queryParams?: any;
        useCredentials?: boolean;
        headers?: any;
        nextOption?: any;
    }

    interface IBackendRes<T> {
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }

    interface IModelPaginate<T> {
        meta: {
            current: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }

    interface ILogin {
        user: {
            _id: string;
            name: string;
            email: string;
            role: string;
        }
        access_token: string;
    }

    interface ITopic {
        id: number;
        name: string;
        nameVi: string;
        description: string;
        createdAt: string;
        updatedAt: string;
    }

    interface IExample {
        id: number;
        chinese: string;
        pinyin: string;
        english: string;
        vietnamese: string;
        wordId: number;
        createdAt: string;
    }

    interface IUser {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        image: string | null;
        role: string;
        accountType: string;
        learnLang: string;
        transLang: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }

    interface IUserWord {
        id: number;
        userId: string;
        wordId: number;
        word: IWord;
        repetitions: number;
        easeFactor: number;
        interval: number;
        nextReview: string;
        lastReview: string | null;
        createdAt: string;
    }

    interface ILearningStats {
        total: number;
        dueToday: number;
    }

    interface ILearningDue {
        dueCount: number;
        total: number;
        words: IUserWord[];
    }

    interface IWord {
        id: number;
        simplified: string;
        traditional: string | null;
        pinyin: string | null;
        hanViet: string | null;
        englishDef: string | null;
        vietnameseDef: string | null;
        hskLevel: number | null;
        partOfSpeech: string | null;
        frequency: number | null;
        createdAt: string;
        updatedAt: string;
    }

}
