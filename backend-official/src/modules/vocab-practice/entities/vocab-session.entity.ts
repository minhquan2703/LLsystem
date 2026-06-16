import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VocabPracticeRun } from './vocab-practice-run.entity';

@Entity('vocab_sessions')
export class VocabSession {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    runId: number;

    @ManyToOne(() => VocabPracticeRun, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'runId' })
    run: VocabPracticeRun;

    @Column()
    userId: string;

    @Column({ type: 'int' })
    sessionIndex: number;

    //danh sách id senses được chọn cho phiên này, lưu sẵn khi tạo session
    @Column({ type: 'jsonb', default: '[]' })
    senseIds: number[];

    @Column({ type: 'jsonb', nullable: true })
    draftAnswers: { senseId: number; synonymsInput: string[]; exampleInput: string }[] | null;

    @Column({ type: 'int', default: 0 })
    currentSenseIndex: number;

    @Column({ type: 'text', nullable: true })
    geminiNote: string | null;

    @Column({ type: 'boolean', default: false })
    isCompleted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    completedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}
