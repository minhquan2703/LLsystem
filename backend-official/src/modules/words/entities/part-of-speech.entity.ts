import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { Word } from '@/modules/words/entities/word.entity';
import { Example } from '@/modules/examples/entities/example.entity';

@Entity('parts_of_speech')
export class PartOfSpeech {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    nameEn: string;

    @Column()
    nameVi: string;

    @Column()
    nameZh: string;

    @ManyToMany(() => Word, (word) => word.partsOfSpeech)
    words: Word[];

    @OneToMany(() => Example, (example) => example.partOfSpeech)
    examples: Example[];
}
