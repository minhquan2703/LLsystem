import { PartialType } from '@nestjs/mapped-types';
import { CreateExampleDto } from '@/modules/examples/dto/create-example.dto';

export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
