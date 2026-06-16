import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { EnglishWordSense } from '@/modules/english-words/entities/english-word-sense.entity';

export type SenseProgressState = 'new' | 'learning' | 'review' | 'suspended';

@Entity('user_sense_progress')
@Unique(['userId', 'senseId'])
export class UserSenseProgress {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    senseId: number;

    @ManyToOne(() => EnglishWordSense, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senseId' })
    sense: EnglishWordSense;

    @Column({ type: 'int', default: 0 })
    repetitions: number;

    @Column({ type: 'float', default: 2.5 })
    easeFactor: number;

    @Column({ type: 'int', default: 1 })
    interval: number;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    nextReview: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastReview: Date | null;

    @Column({ type: 'int', default: 0 })
    lapseCount: number;

    @Column({ type: 'int', default: 0 })
    streak: number;

    //new=chưa học, learning=đang học, review=thành thục, suspended=leech bị tạm dừng
    @Column({ type: 'varchar', length: 10, default: 'new' })
    state: SenseProgressState;

    @CreateDateColumn()
    createdAt: Date;
}
