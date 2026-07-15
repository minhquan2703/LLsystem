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

    interface ISpeakingProsodyContourPoint {
        t: number;
        f0: number | null;
    }

    interface ISpeakingProsodyIntonation {
        pitchRangeSemitones: number;
        f0Mean: number;
        f0Std: number;
        declinationSlope: number;
        voicedRatio: number;
        terminalTone: 'falling' | 'rising' | 'level';
        pitchContour: ISpeakingProsodyContourPoint[];
    }

    interface ISpeakingProsodyPhoneme {
        phone: string;
        start: number;
        end: number;
    }

    interface ISpeakingProsodyWord {
        word: string;
        start: number;
        end: number;
    }

    interface ISpeakingProsodyAlignment {
        words: ISpeakingProsodyWord[];
        phonemes: ISpeakingProsodyPhoneme[];
    }

    interface ISpeakingProsodyRhythm {
        nPVI: number | null;
        rPVI: number | null;
        percentV: number | null;
        varcoV: number | null;
        vocalicCount: number;
        consonantalCount: number;
        nativeRefNPVI: number;
    }

    interface ISpeakingProsody {
        intonation: ISpeakingProsodyIntonation | null;
        alignment: ISpeakingProsodyAlignment | null;
        rhythm: ISpeakingProsodyRhythm | null;
        pronunciation: null;
        vowelSpace: null;
        error: string | null;
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
        prosody: ISpeakingProsody | null;
        prosodyStatus: string;
        createdAt: string;
    }

    interface ISpeakingProgressPoint {
        weekStart: string;
        avgOverall: number;
        avgFluency: number;
        avgLexical: number;
        avgGrammar: number;
        avgPronunciation: number;
        attemptCount: number;
    }

    // ── Vocab Practice ────────────────────────────────────────────────────────────

    type SenseTier = 'obvious' | 'academic';
    type PracticeMode = 'topic' | 'context';
    type SenseProgressState = 'new' | 'learning' | 'review' | 'suspended';

    interface IEnglishWord {
        id: number;
        lemma: string;
        level: string | null;
        frequency: number;
        senses?: IEnglishWordSense[];
    }

    interface IEnglishWordSense {
        id: number;
        wordId: number;
        word?: IEnglishWord;
        pos: string | null;
        glossEn: string;
        glossVi: string | null;
        synonyms: string[];
        contextTags: string[];
        tier: SenseTier;
        exampleEn: string | null;
    }

    interface IUserSenseProgress {
        id: number;
        userId: string;
        senseId: number;
        sense: IEnglishWordSense;
        repetitions: number;
        easeFactor: number;
        interval: number;
        nextReview: string;
        lastReview: string | null;
        lapseCount: number;
        streak: number;
        state: SenseProgressState;
        createdAt: string;
    }

    interface IVocabPracticeRun {
        id: number;
        userId: string;
        mode: PracticeMode;
        targetTopic: string | null;
        sessionCount: number;
        completedSessions: number;
        completedAt: string | null;
        createdAt: string;
    }

    interface IVocabSession {
        id: number;
        runId: number;
        userId: string;
        sessionIndex: number;
        senseIds: number[];
        draftAnswers: { senseId: number; synonymsInput: string[]; exampleInput: string }[] | null;
        currentSenseIndex: number;
        geminiNote: string | null;
        isCompleted: boolean;
        completedAt: string | null;
        createdAt: string;
    }

    interface IVocabExampleFeedback {
        isGrammaticallyCorrect: boolean;
        usesSenseCorrectly: boolean;
        improvement: string;
    }

    interface IVocabAttempt {
        id: number;
        sessionId: number;
        senseId: number;
        sense: IEnglishWordSense;
        synonymsInput: string[];
        synonymScore: number | null;
        exampleInput: string | null;
        exampleBand: number | null;
        exampleFeedback: IVocabExampleFeedback | null;
        resolved: boolean;
        createdAt: string;
    }

    interface IActiveRunResponse {
        run: IVocabPracticeRun;
        session: IVocabSession;
        senses: IEnglishWordSense[];
    }

    interface ISubmitSessionResponse {
        nextSessionId: number | null;
        nextSenses: IEnglishWordSense[] | null;
        runComplete: boolean;
    }

    interface ISessionResultResponse {
        session: IVocabSession;
        senses: IEnglishWordSense[];
        attempts: IVocabAttempt[];
    }

    interface IStartRunResponse {
        run: IVocabPracticeRun;
        session: IVocabSession;
        senses: IEnglishWordSense[];
    }

    interface IRunHistoryItem {
        run: IVocabPracticeRun;
        sessions: IVocabSession[];
        hasResumableSessions: boolean;
    }

}
