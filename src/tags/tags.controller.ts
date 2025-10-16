import { Controller, Get } from '@nestjs/common';
import { TagsService, TagsResponse } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll(): Promise<TagsResponse> {
    return this.tagsService.findAll();
  }
}
