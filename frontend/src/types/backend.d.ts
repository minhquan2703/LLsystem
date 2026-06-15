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
        refresh_token: string;
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
        partOfSpeechId?: number | null;
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
        hskLevel: number | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }

    type UserWordState = 'new' | 'learning' | 'review' | 'suspended';

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
        lapseCount: number;
        streak: number;
        state: UserWordState;
        createdAt: string;
    }

    interface IReviewResult {
        userWord: IUserWord;
        againToday: boolean;
        isLeech: boolean;
    }

    interface ILearningStats {
        total: number;
        dueToday: number;
        newCount: number;
        learningCount: number;
        reviewCount: number;
        suspendedCount: number;
    }

    interface ILearningDue {
        dueCount: number;
        newCount: number;
        learningCount: number;
        reviewCount: number;
        total: number;
        suspendedCount: number;
        words: IUserWord[];
    }

    type QuizDirection = 'zh-to-meaning' | 'meaning-to-zh';
    type QuizLanguage = 'vi' | 'en';
    type QuizWordSource = 'mine' | 'new' | 'mixed';

    interface IQuizQuestion {
        wordId: number;
        promptText: string;
        promptSub: string | null;
        options: string[];
        correctIndex: number;
    }

    interface IQuizGenerateResult {
        questions: IQuizQuestion[];
    }

    interface IQuizAttempt {
        id: number;
        userId: string;
        direction: QuizDirection;
        language: QuizLanguage;
        wordSource: QuizWordSource;
        questionCount: number;
        optionCount: number;
        correctCount: number;
        createdAt: string;
    }

    interface IQuizStats {
        totalAttempts: number;
        averageScore: number;
        bestScore: number;
        totalQuestionsAnswered: number;
        totalCorrect: number;
    }

    interface IPartOfSpeech {
        id: number;
        code: string;
        nameEn: string;
        nameVi: string;
        nameZh: string;
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
        frequency: number | null;
        partOfSpeech?: string | null;
        partsOfSpeech?: IPartOfSpeech[];
        topics?: ITopic[];
        examples?: IExample[];
        createdAt: string;
        updatedAt: string;
    }

    type SpeakingPart = 1 | 2 | 3;

    interface ISpeakingQuestion {
        id: number;
        part: SpeakingPart;
        topic: string;
        questionText: string;
        cueCardPoints: string[] | null;
        language: string;
        orderIndex: number;
        createdAt: string;
    }

    interface ISpeakingCorrection {
        quote: string;
        issue: string;
        suggestion: string;
    }

    interface ISpeakingVocabSuggestion {
        original: string;
        better: string;
    }

    interface ISpeakingFeedback {
        corrections: ISpeakingCorrection[];
        vocabularySuggestions: ISpeakingVocabSuggestion[];
        pronunciationNotes: string[];
        strengths: string[];
        improvements: string[];
        modelAnswer: string;
    }

    interface ISpeakingMetrics {
        wordCount: number;
        wordsPerMinute: number;
        fillerWordCount: number;
        fillerWords: Record<string, number>;
        pauseCount: number;
        totalPauseSeconds: number;
        longPauseCount: number;
    }

    interface ISpeakingAttempt {
        id: number;
        userId: string;
        questionId: number;
        question: ISpeakingQuestion;
        durationSeconds: number;
        transcript: string;
        audioUrl: string | null;
        bandFluency: number;
        bandLexical: number;
        bandGrammar: number;
        bandPronunciation: number;
        bandOverall: number;
        feedback: ISpeakingFeedback;
        metrics: ISpeakingMetrics;
        createdAt: string;
    }

}
