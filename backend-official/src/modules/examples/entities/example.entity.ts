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

@Entity('examples')
export class Example {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  chinese: string; // câu ví dụ tiếng Trung

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

  @CreateDateColumn()
  createdAt: Date;
}
