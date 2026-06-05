import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamplesService } from '@/modules/examples/examples.service';
import { CreateExampleDto } from '@/modules/examples/dto/create-example.dto';
import { UpdateExampleDto } from '@/modules/examples/dto/update-example.dto';
import { Public, ResponseMessage } from '@/decorator/customize';

@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Post()
  @ResponseMessage('Tạo câu ví dụ thành công')
  create(@Body() createExampleDto: CreateExampleDto) {
    return this.examplesService.create(createExampleDto);
  }

  @Get()
  @Public()
  findAll(@Query('wordId') wordId: string) {
    return this.examplesService.findAll(+wordId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.examplesService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật câu ví dụ thành công')
  update(@Param('id') id: string, @Body() updateExampleDto: UpdateExampleDto) {
    return this.examplesService.update(+id, updateExampleDto);
  }

  @Delete(':id')
  @ResponseMessage('Xóa câu ví dụ thành công')
  remove(@Param('id') id: string) {
    return this.examplesService.remove(+id);
  }
}
