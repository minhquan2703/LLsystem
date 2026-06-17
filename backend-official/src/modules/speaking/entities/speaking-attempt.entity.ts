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

export interface SpeakingProsodyIntonation {
    pitchRangeSemitones: number;
    f0Mean: number;
    f0Std: number;
    declinationSlope: number;
    voicedRatio: number;
    terminalTone: 'falling' | 'rising' | 'level';
}

export interface SpeakingProsody {
    intonation: SpeakingProsodyIntonation | null;
    alignment: null;
    rhythm: null;
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
