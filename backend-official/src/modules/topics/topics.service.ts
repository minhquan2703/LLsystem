import { BadRequestException, Injectable } from '@nestjs/common';
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

  async create(dto: CreateTopicDto) {
    const topic = this.topicsRepo.create(dto);
    await this.topicsRepo.save(topic);
    return { id: topic.id };
  }

  async findAll() {
    return await this.topicsRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const topic = await this.topicsRepo.findOne({
      where: { id },
      relations: { words: true },
    });
    if (!topic) throw new BadRequestException('Chủ đề không tồn tại');
    return topic;
  }

  async update(id: number, dto: UpdateTopicDto) {
    const topic = await this.topicsRepo.findOneBy({ id });
    if (!topic) throw new BadRequestException('Chủ đề không tồn tại');
    Object.assign(topic, dto);
    return await this.topicsRepo.save(topic);
  }

  async remove(id: number) {
    const topic = await this.topicsRepo.findOneBy({ id });
    if (!topic) throw new BadRequestException('Chủ đề không tồn tại');
    return await this.topicsRepo.delete(id);
  }
}
