import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Word } from '@/modules/words/entities/word.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // tên chủ đề: Family

  @Column({ nullable: true })
  nameVi: string; // tên tiếng Việt: Gia đình

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Word, (word) => word.topics)
  words: Word[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
