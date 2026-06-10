import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Word } from '@/modules/words/entities/word.entity';

export type UserWordState = 'new' | 'learning' | 'review' | 'suspended';

@Entity('user_words')
@Unique(['userId', 'wordId'])
export class UserWord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    wordId: number;

    @ManyToOne(() => Word, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'wordId' })
    word: Word;

    @Column({ type: 'int', default: 0 })
    repetitions: number;

    @Column({ type: 'float', default: 2.5 })
    easeFactor: number;

    @Column({ type: 'int', default: 1 })
    interval: number;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    nextReview: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastReview: Date;

    //số lần quên từ này (interval reset về nhỏ sau khi đã học)
    @Column({ type: 'int', default: 0 })
    lapseCount: number;

    //số lần trả lời đúng liên tiếp hiện tại
    @Column({ type: 'int', default: 0 })
    streak: number;

    //new=mới thêm, learning=đang học, review=đã thành thục, suspended=leech bị tạm dừng
    @Column({ type: 'varchar', length: 10, default: 'new' })
    state: UserWordState;

    @CreateDateColumn()
    createdAt: Date;
}
