import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 'USER' })
  role: string;

  @Column({ default: 'LOCAL' })
  accountType: string;

  @Column({ default: 'zh' })
  learnLang: string;

  @Column({ default: 'vi' })
  transLang: string;

  @Column({ type: 'int', nullable: true })
  hskLevel: number | null;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  codeId: string;

  @Column({ type: 'timestamptz', nullable: true })
  codeExpired: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
