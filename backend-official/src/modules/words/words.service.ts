import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateWordDto } from '@/modules/words/dto/create-word.dto';
import { UpdateWordDto } from '@/modules/words/dto/update-word.dto';
import { Word } from '@/modules/words/entities/word.entity';
import { Topic } from '@/modules/topics/entities/topic.entity';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Injectable()
export class WordsService {
    constructor(
        @InjectRepository(Word)
        private wordsRepo: Repository<Word>,

        @InjectRepository(Topic)
        private topicsRepo: Repository<Topic>,

        @InjectRepository(PartOfSpeech)
        private partOfSpeechRepo: Repository<PartOfSpeech>,
    ) {}

    async create(createWordDto: CreateWordDto) {
        const { topicIds, partOfSpeechCodes, ...wordFields } = createWordDto;
        const newWord = this.wordsRepo.create(wordFields);
        if (topicIds?.length) {
            newWord.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
        }
        if (partOfSpeechCodes?.length) {
            newWord.partsOfSpeech = await this.partOfSpeechRepo.findBy({ code: In(partOfSpeechCodes) });
        }
        await this.wordsRepo.save(newWord);
        return { id: newWord.id };
    }

    async findAll(search: string, hskLevel: number, topicId: number, onlyHsk: boolean, current: number, pageSize: number) {
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
        } else if (onlyHsk) {
            queryBuilder.andWhere('word.hskLevel IS NOT NULL');
        }
        if (topicId) {
            //dùng subquery để tránh conflict alias với leftJoinAndSelect bên dưới
            const subQuery = this.wordsRepo
                .createQueryBuilder('subWord')
                .select('subWord.id')
                .innerJoin('subWord.topics', 'subTopic')
                .where('subTopic.id = :topicId')
                .getQuery();
            queryBuilder.andWhere(`word.id IN (${subQuery})`).setParameter('topicId', topicId);
        }

        queryBuilder.leftJoinAndSelect('word.topics', 'topic');

        const [results, total] = await queryBuilder
            .skip((current - 1) * pageSize)
            .take(pageSize)
            .orderBy('word.hskLevel', 'ASC')
            .addOrderBy('word.id', 'ASC')
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
            relations: { topics: true, examples: true, partsOfSpeech: true },
        });
        if (!word) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }
        return word;
    }

    async update(id: number, updateWordDto: UpdateWordDto) {
        const word = await this.wordsRepo.findOne({
            where: { id },
            relations: { topics: true, partsOfSpeech: true },
        });
        if (!word) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }

        const { topicIds, partOfSpeechCodes, ...wordFields } = updateWordDto;
        Object.assign(word, wordFields);
        if (topicIds) {
            word.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
        }
        if (partOfSpeechCodes) {
            word.partsOfSpeech = await this.partOfSpeechRepo.findBy({ code: In(partOfSpeechCodes) });
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
