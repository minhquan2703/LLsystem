import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { QuizDirection, QuizLanguage, QuizWordSource } from '@/modules/quiz/dto/generate-quiz.dto';

@Entity('quiz_attempts')
export class QuizAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column({ type: 'varchar', length: 20 })
    direction: QuizDirection;

    @Column({ type: 'varchar', length: 5 })
    language: QuizLanguage;

    @Column({ type: 'varchar', length: 10 })
    wordSource: QuizWordSource;

    @Column({ type: 'int' })
    questionCount: number;

    @Column({ type: 'int' })
    optionCount: number;

    @Column({ type: 'int' })
    correctCount: number;

    @CreateDateColumn()
    createdAt: Date;
}
