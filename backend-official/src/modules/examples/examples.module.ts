import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamplesService } from '@/modules/examples/examples.service';
import { ExamplesController } from '@/modules/examples/examples.controller';
import { Example } from '@/modules/examples/entities/example.entity';
import { Word } from '@/modules/words/entities/word.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Example, Word])],
  controllers: [ExamplesController],
  providers: [ExamplesService],
  exports: [ExamplesService],
})
export class ExamplesModule {}
