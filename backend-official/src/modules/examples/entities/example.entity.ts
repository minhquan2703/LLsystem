import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Word } from '@/modules/words/entities/word.entity';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Entity('examples')
export class Example {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  chinese: string;

  @Column({ type: 'text', nullable: true })
  pinyin: string;

  @Column({ type: 'text', nullable: true })
  english: string;

  @Column({ type: 'text', nullable: true })
  vietnamese: string;

  @ManyToOne(() => Word, (word) => word.examples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wordId' })
  word: Word;

  @Index()
  @Column()
  wordId: number;

  @ManyToOne(() => PartOfSpeech, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partOfSpeechId' })
  partOfSpeech: PartOfSpeech | null;

  @Column({ type: 'int', nullable: true })
  partOfSpeechId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
