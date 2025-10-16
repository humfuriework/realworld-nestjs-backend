import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ArticlePayloadDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  tagList?: string[];
}

export class CreateArticleDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ArticlePayloadDto)
  article: ArticlePayloadDto;
}
