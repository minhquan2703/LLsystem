import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Topic } from '@/modules/topics/entities/topic.entity';
import { Example } from '@/modules/examples/entities/example.entity';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  simplified: string; // 简体 - giản thể

  @Column({ nullable: true })
  traditional: string; // 繁体 - phồn thể

  @Index()
  @Column({ nullable: true })
  pinyin: string; // phiên âm: xuéxí

  @Column({ nullable: true })
  hanViet: string; // âm Hán-Việt: học tập

  @Column({ type: 'text', nullable: true })
  englishDef: string; // nghĩa tiếng Anh (CC-CEDICT)

  @Column({ type: 'text', nullable: true })
  vietnameseDef: string; // nghĩa tiếng Việt

  @Index()
  @Column({ type: 'smallint', nullable: true })
  hskLevel: number; // 1-9

  @Column({ nullable: true })
  partOfSpeech: string; //sẽ xóa sau khi chạy migrate-pos

  @ManyToMany(() => PartOfSpeech, (pos) => pos.words)
  @JoinTable({ name: 'word_parts_of_speech' })
  partsOfSpeech: PartOfSpeech[];

  @Column({ nullable: true })
  radical: string; // bộ pháp — chỉ điền cho đơn tự (1 ký tự)

  @Column({ type: 'int', nullable: true })
  frequency: number; // thứ hạng tần suất

  @ManyToMany(() => Topic, (topic) => topic.words)
  @JoinTable({ name: 'word_topics' })
  topics: Topic[];

  @OneToMany(() => Example, (example) => example.word)
  examples: Example[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
