import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
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

    async create(createExampleDto: CreateExampleDto) {
        const wordExists = await this.wordsRepo.existsBy({ id: createExampleDto.wordId });
        if (!wordExists) {
            throw new BadRequestException(AppErrorCode.WORD_NOT_FOUND);
        }
        const newExample = this.examplesRepo.create(createExampleDto);
        await this.examplesRepo.save(newExample);
        return { id: newExample.id };
    }

    async findAll(wordId: number) {
        return await this.examplesRepo.find({
            where: wordId ? { wordId } : {},
            order: { id: 'DESC' },
        });
    }

    async findOne(id: number) {
        const example = await this.examplesRepo.findOneBy({ id });
        if (!example) {
            throw new BadRequestException(AppErrorCode.EXAMPLE_NOT_FOUND);
        }
        return example;
    }

    async update(id: number, updateExampleDto: UpdateExampleDto) {
        const example = await this.examplesRepo.findOneBy({ id });
        if (!example) {
            throw new BadRequestException(AppErrorCode.EXAMPLE_NOT_FOUND);
        }
        Object.assign(example, updateExampleDto);
        return await this.examplesRepo.save(example);
    }

    async remove(id: number) {
        const example = await this.examplesRepo.findOneBy({ id });
        if (!example) {
            throw new BadRequestException(AppErrorCode.EXAMPLE_NOT_FOUND);
        }
        return await this.examplesRepo.delete(id);
    }
}
