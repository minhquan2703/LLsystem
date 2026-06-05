import { BadRequestException, Injectable } from '@nestjs/common';
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

  async create(dto: CreateWordDto) {
    const { topicIds, ...rest } = dto;
    const word = this.wordsRepo.create(rest);
    if (topicIds?.length) {
      word.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
    }
    await this.wordsRepo.save(word);
    return { id: word.id };
  }

  async findAll(search: string, hskLevel: number, current: number, pageSize: number) {
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const qb = this.wordsRepo.createQueryBuilder('word');

    if (search) {
      qb.andWhere(
        '(word.simplified LIKE :s OR word.pinyin LIKE :s OR word.hanViet LIKE :s OR word.vietnameseDef LIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (hskLevel) {
      qb.andWhere('word.hskLevel = :hskLevel', { hskLevel });
    }

    const [results, total] = await qb
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
    if (!word) throw new BadRequestException('Từ không tồn tại');
    return word;
  }

  async update(id: number, dto: UpdateWordDto) {
    const word = await this.wordsRepo.findOneBy({ id });
    if (!word) throw new BadRequestException('Từ không tồn tại');

    const { topicIds, ...rest } = dto;
    Object.assign(word, rest);
    if (topicIds) {
      word.topics = await this.topicsRepo.findBy({ id: In(topicIds) });
    }
    return await this.wordsRepo.save(word);
  }

  async remove(id: number) {
    const word = await this.wordsRepo.findOneBy({ id });
    if (!word) throw new BadRequestException('Từ không tồn tại');
    return await this.wordsRepo.delete(id);
  }
}
