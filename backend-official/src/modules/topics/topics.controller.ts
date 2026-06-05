import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TopicsService } from '@/modules/topics/topics.service';
import { CreateTopicDto } from '@/modules/topics/dto/create-topic.dto';
import { UpdateTopicDto } from '@/modules/topics/dto/update-topic.dto';
import { Public, ResponseMessage } from '@/decorator/customize';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @ResponseMessage('Tạo chủ đề thành công')
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.topicsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật chủ đề thành công')
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(+id, updateTopicDto);
  }

  @Delete(':id')
  @ResponseMessage('Xóa chủ đề thành công')
  remove(@Param('id') id: string) {
    return this.topicsService.remove(+id);
  }
}
