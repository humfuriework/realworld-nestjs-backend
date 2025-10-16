import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

export interface TagsResponse {
  tags: string[];
}

const TAG_CACHE_KEY = 'tags:all';
const TAG_CACHE_TTL = 60;

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(): Promise<TagsResponse> {
    const cached = await this.cache.get<string[]>(TAG_CACHE_KEY);

    if (cached) {
      return { tags: cached };
    }

    const tagRecords = await this.prisma.tag.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const tags = tagRecords.map((tag) => tag.name);

    await this.cache.set(TAG_CACHE_KEY, tags, TAG_CACHE_TTL);

    return { tags };
  }
}
