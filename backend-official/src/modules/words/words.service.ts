import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateWordDto } from '@/modules/words/dto/create-word.dto';
import { UpdateWordDto } from '@/modules/words/dto/update-word.dto';
import { Word } from '@/modules/words/entities/word.entity';
import { Topic } from '@/modules/topics/entities/topic.entity';

@Injectable()
export class WordsService {
    constructor(
        @InjectRepository(Word)
        private wordsRepo: Repository<Word>,

        @InjectRepository(Topic)
        private topicsRepo: Repository<Topic>,
    ) {}

    async create(createWordDto: CreateWordDto) {
        const { topicIds, ...wordFields } = createWordDto;
        const newWord = this.wordsRepo.create(wordFields);
        if (topicIds?.length) {
            newWord.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
        }
        await this.wordsRepo.save(newWord);
        return { id: newWord.id };
    }

    async findAll(search: string, hskLevel: number, current: number, pageSize: number) {
        if (!current) {
            current = 1;
        }
        if (!pageSize) {
            pageSize = 10;
        }

        const queryBuilder = this.wordsRepo.createQueryBuilder('word');

        if (search) {
            queryBuilder.andWhere(
                '(word.simplified LIKE :searchPattern OR word.pinyin LIKE :searchPattern OR word.hanViet LIKE :searchPattern OR word.vietnameseDef LIKE :searchPattern)',
                { searchPattern: `%${search}%` },
            );
        }
        if (hskLevel) {
            queryBuilder.andWhere('word.hskLevel = :hskLevel', { hskLevel });
        }

        const [results, total] = await queryBuilder
            .skip((current - 1) * pageSize)
            .take(pageSize)
            .orderBy('word.id', 'DESC')
            .getManyAndCount();

        return {
            meta: {
                current,
                pageSize,
                pages: Math.ceil(total / pageSize),
                total,
            },
            results,
        };
    }

    async findOne(id: number) {
        const word = await this.wordsRepo.findOne({
            where: { id },
            relations: { topics: true, examples: true },
        });
        if (!word) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }
        return word;
    }

    async update(id: number, updateWordDto: UpdateWordDto) {
        const word = await this.wordsRepo.findOneBy({ id });
        if (!word) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }

        const { topicIds, ...wordFields } = updateWordDto;
        Object.assign(word, wordFields);
        if (topicIds) {
            word.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
        }
        return await this.wordsRepo.save(word);
    }

    async remove(id: number) {
        const word = await this.wordsRepo.findOneBy({ id });
        if (!word) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }
        return await this.wordsRepo.delete(id);
    }
}
