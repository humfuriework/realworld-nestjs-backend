import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class CommentPayloadDto {
  @IsString()
  @MinLength(1)
  body: string;
}

export class CreateCommentDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CommentPayloadDto)
  comment: CommentPayloadDto;
}
