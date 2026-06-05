import { PartialType } from '@nestjs/mapped-types';
import { CreateWordDto } from '@/modules/words/dto/create-word.dto';

// PartialType: kế thừa toàn bộ field của CreateWordDto nhưng đều thành optional
export class UpdateWordDto extends PartialType(CreateWordDto) {}
