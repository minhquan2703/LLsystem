import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('speaking_questions')
export class SpeakingQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    //1=interview, 2=cue card, 3=discussion
    @Column({ type: 'int' })
    part: number;

    @Column({ type: 'varchar', length: 100 })
    topic: string;

    @Column({ type: 'text' })
    questionText: string;

    //chỉ part 2: các gạch đầu dòng "You should say..."
    @Column({ type: 'jsonb', nullable: true })
    cueCardPoints: string[] | null;

    @Column({ type: 'varchar', length: 5, default: 'en' })
    language: string;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @CreateDateColumn()
    createdAt: Date;
}
