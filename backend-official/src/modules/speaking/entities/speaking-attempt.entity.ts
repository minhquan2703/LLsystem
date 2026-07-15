import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { SpeakingQuestion } from '@/modules/speaking/entities/speaking-question.entity';

export interface SpeakingCorrection {
    quote: string;
    issue: string;
    suggestion: string;
}

export interface SpeakingVocabSuggestion {
    original: string;
    better: string;
}

export interface SpeakingFeedback {
    corrections: SpeakingCorrection[];
    vocabularySuggestions: SpeakingVocabSuggestion[];
    pronunciationNotes: string[];
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
}

export interface SpeakingMetrics {
    wordCount: number;
    wordsPerMinute: number;
    fillerWordCount: number;
    fillerWords: Record<string, number>;
    pauseCount: number;
    totalPauseSeconds: number;
    longPauseCount: number;
}

export interface SpeakingProsodyContourPoint {
    t: number;
    f0: number | null;
}

export interface SpeakingProsodyIntonation {
    pitchRangeSemitones: number;
    f0Mean: number;
    f0Std: number;
    declinationSlope: number;
    voicedRatio: number;
    terminalTone: 'falling' | 'rising' | 'level';
    pitchContour: SpeakingProsodyContourPoint[];
}

export interface SpeakingProsodyPhoneme {
    phone: string;
    start: number;
    end: number;
}

export interface SpeakingProsodyWord {
    word: string;
    start: number;
    end: number;
}

export interface SpeakingProsodyAlignment {
    words: SpeakingProsodyWord[];
    phonemes: SpeakingProsodyPhoneme[];
}

export interface SpeakingProsodyRhythm {
    nPVI: number | null;
    rPVI: number | null;
    percentV: number | null;
    varcoV: number | null;
    vocalicCount: number;
    consonantalCount: number;
    nativeRefNPVI: number;
}

export interface SpeakingProsody {
    intonation: SpeakingProsodyIntonation | null;
    alignment: SpeakingProsodyAlignment | null;
    rhythm: SpeakingProsodyRhythm | null;
    pronunciation: null;
    vowelSpace: null;
    error: string | null;
}

@Entity('speaking_attempts')
export class SpeakingAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    questionId: number;

    @ManyToOne(() => SpeakingQuestion, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: SpeakingQuestion;

    @Column({ type: 'float' })
    durationSeconds: number;

    @Column({ type: 'text' })
    transcript: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    audioUrl: string | null;

    @Column({ type: 'float' })
    bandFluency: number;

    @Column({ type: 'float' })
    bandLexical: number;

    @Column({ type: 'float' })
    bandGrammar: number;

    @Column({ type: 'float' })
    bandPronunciation: number;

    @Column({ type: 'float' })
    bandOverall: number;

    @Column({ type: 'jsonb' })
    feedback: SpeakingFeedback;

    @Column({ type: 'jsonb' })
    metrics: SpeakingMetrics;

    @Column({ type: 'jsonb', nullable: true })
    prosody: SpeakingProsody | null;

    @Column({ type: 'varchar', length: 16, default: 'pending' })
    prosodyStatus: string;

    @CreateDateColumn()
    createdAt: Date;
}
