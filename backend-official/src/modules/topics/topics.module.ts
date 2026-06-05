import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicsService } from '@/modules/topics/topics.service';
import { TopicsController } from '@/modules/topics/topics.controller';
import { Topic } from '@/modules/topics/entities/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Topic])],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
