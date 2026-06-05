import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WordsService } from '@/modules/words/words.service';
import { CreateWordDto } from '@/modules/words/dto/create-word.dto';
import { UpdateWordDto } from '@/modules/words/dto/update-word.dto';
import { Public, ResponseMessage } from '@/decorator/customize';

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  @ResponseMessage('Tạo từ mới thành công')
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('search') search: string,
    @Query('hskLevel') hskLevel: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.wordsService.findAll(search, +hskLevel, +current, +pageSize);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật từ thành công')
  update(@Param('id') id: string, @Body() updateWordDto: UpdateWordDto) {
    return this.wordsService.update(+id, updateWordDto);
  }

  @Delete(':id')
  @ResponseMessage('Xóa từ thành công')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(+id);
  }
}
