import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExampleDto } from '@/modules/examples/dto/create-example.dto';
import { UpdateExampleDto } from '@/modules/examples/dto/update-example.dto';
import { Example } from '@/modules/examples/entities/example.entity';
import { Word } from '@/modules/words/entities/word.entity';

@Injectable()
export class ExamplesService {
  constructor(
    @InjectRepository(Example)
    private examplesRepo: Repository<Example>,

    @InjectRepository(Word)
    private wordsRepo: Repository<Word>,
  ) {}

  async create(dto: CreateExampleDto) {
    const wordExists = await this.wordsRepo.existsBy({ id: dto.wordId });
    if (!wordExists) throw new BadRequestException('Từ không tồn tại');

    const example = this.examplesRepo.create(dto);
    await this.examplesRepo.save(example);
    return { id: example.id };
  }

  async findAll(wordId: number) {
    return await this.examplesRepo.find({
      where: wordId ? { wordId } : {},
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const example = await this.examplesRepo.findOneBy({ id });
    if (!example) throw new BadRequestException('Câu ví dụ không tồn tại');
    return example;
  }

  async update(id: number, dto: UpdateExampleDto) {
    const example = await this.examplesRepo.findOneBy({ id });
    if (!example) throw new BadRequestException('Câu ví dụ không tồn tại');
    Object.assign(example, dto);
    return await this.examplesRepo.save(example);
  }

  async remove(id: number) {
    const example = await this.examplesRepo.findOneBy({ id });
    if (!example) throw new BadRequestException('Câu ví dụ không tồn tại');
    return await this.examplesRepo.delete(id);
  }
}
