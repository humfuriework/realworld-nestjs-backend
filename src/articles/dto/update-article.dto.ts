import { Type } from 'class-transformer';
import {
  IsDefined,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class UpdateArticlePayloadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;
}

export class UpdateArticleDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateArticlePayloadDto)
  article: UpdateArticlePayloadDto;
}
