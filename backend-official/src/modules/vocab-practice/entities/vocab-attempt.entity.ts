import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VocabSession } from './vocab-session.entity';
import { EnglishWordSense } from '@/modules/english-words/entities/english-word-sense.entity';

export interface VocabExampleFeedback {
    isGrammaticallyCorrect: boolean;
    usesSenseCorrectly: boolean;
    improvement: string;
}

@Entity('vocab_attempts')
export class VocabAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @ManyToOne(() => VocabSession, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    session: VocabSession;

    @Column()
    senseId: number;

    @ManyToOne(() => EnglishWordSense, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senseId' })
    sense: EnglishWordSense;

    @Column({ type: 'text', array: true, default: '{}' })
    synonymsInput: string[];

    //điểm synonym sau khi Gemini giải quyết pending; null = chưa grade xong
    @Column({ type: 'float', nullable: true })
    synonymScore: number | null;

    @Column({ type: 'text', nullable: true })
    exampleInput: string | null;

    //band IELTS lexical resource 0-9; null nếu không viết example
    @Column({ type: 'float', nullable: true })
    exampleBand: number | null;

    @Column({ type: 'jsonb', nullable: true })
    exampleFeedback: VocabExampleFeedback | null;

    //true khi Gemini đã chấm xong cho attempt này
    @Column({ type: 'boolean', default: false })
    resolved: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
