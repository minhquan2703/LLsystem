import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EnglishWordSense } from './english-word-sense.entity';

@Entity('english_words')
export class EnglishWord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    lemma: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    level: string | null;

    @Column({ type: 'int', default: 0 })
    frequency: number;

    @OneToMany(() => EnglishWordSense, sense => sense.word)
    senses: EnglishWordSense[];
}
