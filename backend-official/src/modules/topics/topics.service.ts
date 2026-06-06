import { BadRequestException, Injectable } from '@nestjs/common';
import { AppErrorCode } from '@/common/errors.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTopicDto } from '@/modules/topics/dto/create-topic.dto';
import { UpdateTopicDto } from '@/modules/topics/dto/update-topic.dto';
import { Topic } from '@/modules/topics/entities/topic.entity';

@Injectable()
export class TopicsService {
    constructor(
        @InjectRepository(Topic)
        private topicsRepo: Repository<Topic>,
    ) {}

    async create(createTopicDto: CreateTopicDto) {
        const newTopic = this.topicsRepo.create(createTopicDto);
        await this.topicsRepo.save(newTopic);
        return { id: newTopic.id };
    }

    async findAll() {
        return await this.topicsRepo.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number) {
        const topic = await this.topicsRepo.findOne({
            where: { id },
            relations: { words: true },
        });
        if (!topic) {
            throw new BadRequestException(AppErrorCode.TOPIC_NOT_FOUND);
        }
        return topic;
    }

    async update(id: number, updateTopicDto: UpdateTopicDto) {
        const topic = await this.topicsRepo.findOneBy({ id });
        if (!topic) {
            throw new BadRequestException(AppErrorCode.TOPIC_NOT_FOUND);
        }
        Object.assign(topic, updateTopicDto);
        return await this.topicsRepo.save(topic);
    }

    async remove(id: number) {
        const topic = await this.topicsRepo.findOneBy({ id });
        if (!topic) {
            throw new BadRequestException(AppErrorCode.TOPIC_NOT_FOUND);
        }
        return await this.topicsRepo.delete(id);
    }
}
