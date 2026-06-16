import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EnglishWord } from './english-word.entity';

export type SenseTier = 'obvious' | 'academic';

@Entity('english_word_senses')
export class EnglishWordSense {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    wordId: number;

    @ManyToOne(() => EnglishWord, word => word.senses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'wordId' })
    word: EnglishWord;

    @Column({ type: 'varchar', length: 20, nullable: true })
    pos: string | null;

    @Column({ type: 'text' })
    glossEn: string;

    @Column({ type: 'text', nullable: true })
    glossVi: string | null;

    @Column({ type: 'text', array: true, default: '{}' })
    synonyms: string[];

    @Column({ type: 'text', array: true, default: '{}' })
    contextTags: string[];

    @Column({ type: 'varchar', length: 20, default: 'obvious' })
    tier: SenseTier;

    @Column({ type: 'text', nullable: true })
    exampleEn: string | null;
}
