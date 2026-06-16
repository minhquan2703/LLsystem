import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type PracticeMode = 'topic' | 'context';

@Entity('vocab_practice_runs')
export class VocabPracticeRun {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column({ type: 'varchar', length: 20, default: 'topic' })
    mode: PracticeMode;

    @Column({ type: 'varchar', length: 100, nullable: true })
    targetTopic: string | null;

    @Column({ type: 'int', default: 10 })
    sessionCount: number;

    @Column({ type: 'int', default: 0 })
    completedSessions: number;

    @Column({ type: 'timestamptz', nullable: true })
    completedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}
