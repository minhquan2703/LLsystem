import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartOfSpeech } from '@/modules/words/entities/part-of-speech.entity';

@Injectable()
export class PartsOfSpeechService {
    constructor(
        @InjectRepository(PartOfSpeech)
        private partOfSpeechRepo: Repository<PartOfSpeech>,
    ) {}

    async findAll() {
        return this.partOfSpeechRepo.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number) {
        const partOfSpeech = await this.partOfSpeechRepo.findOneBy({ id });
        if (!partOfSpeech) {
            throw new NotFoundException(`Không tìm thấy part of speech với id=${id}`);
        }
        return partOfSpeech;
    }
}
