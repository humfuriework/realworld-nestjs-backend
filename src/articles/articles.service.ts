import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import type {
  ArticleDto,
  MultipleArticlesResponse,
  SingleArticleResponse,
} from './dto/article-response.dto';
import type { Prisma } from '@prisma/client';
import { Prisma as PrismaNS } from '@prisma/client';
import { customAlphabet } from 'nanoid/non-secure';
import slugify from 'slugify';

const ARTICLE_SELECT = PrismaNS.validator<Prisma.ArticleSelect>()({
  slug: true,
  title: true,
  description: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  favoritesCount: true,
  author: {
    select: {
      username: true,
      bio: true,
      image: true,
      followers: {
        select: {
          followerId: true,
        },
      },
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
  favorites: {
    select: {
      userId: true,
    },
  },
});

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  select: typeof ARTICLE_SELECT;
}>;

const slugId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async findAll(
    query: ArticlesQueryDto,
    currentUserId: string | null,
  ): Promise<MultipleArticlesResponse> {
    const where: Prisma.ArticleWhereInput = {};

    if (query.tag) {
      where.tags = {
        some: {
          tag: {
            name: query.tag,
          },
        },
      };
    }

    if (query.author) {
      where.author = {
        username: query.author,
      };
    }

    if (query.favorited) {
      where.favorites = {
        some: {
          user: {
            username: query.favorited,
          },
        },
      };
    }

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
        select: ARTICLE_SELECT,
      }),
      this.prisma.article.count({ where }),
    ]);

    const items = articles.map((article) =>
      this.buildArticleDto(article, currentUserId),
    );

    return {
      articles: items,
      articlesCount: total,
    };
  }

  async findFeed(
    query: ArticlesQueryDto,
    currentUserId: string,
  ): Promise<MultipleArticlesResponse> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followers: {
          some: {
            followerId: currentUserId,
          },
        },
      },
    };

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
        select: ARTICLE_SELECT,
      }),
      this.prisma.article.count({ where }),
    ]);

    const items = articles.map((article) =>
      this.buildArticleDto(article, currentUserId),
    );

    return {
      articles: items,
      articlesCount: total,
    };
  }

  async getArticle(
    slug: string,
    currentUserId: string | null,
  ): Promise<SingleArticleResponse> {
    const article = await this.getArticleRecord(slug);
    return this.buildSingleArticleResponse(article, currentUserId);
  }

  async createArticle(
    authorId: string,
    dto: CreateArticleDto,
  ): Promise<SingleArticleResponse> {
    const { title, description, body, tagList } = dto.article;
    const slug = await this.generateUniqueSlug(title);
    const tags = this.sanitizeTagList(tagList);

    const article = await this.prisma.article.create({
      data: {
        slug,
        title,
        description,
        body,
        authorId,
        tags: tags.length
          ? {
              create: tags.map((name) => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            }
          : undefined,
      },
      select: ARTICLE_SELECT,
    });

    return this.buildSingleArticleResponse(article, authorId);
  }

  async updateArticle(
    slug: string,
    userId: string,
    dto: UpdateArticleDto,
  ): Promise<SingleArticleResponse> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        authorId: true,
        title: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException('Cannot update article');
    }

    const payload = dto.article;
    const data: Prisma.ArticleUpdateInput = {};
    let newSlug = slug;

    if (payload.title && payload.title !== existing.title) {
      const generated = await this.generateUniqueSlug(payload.title);
      data.title = payload.title;
      newSlug = generated;
      data.slug = generated;
    }

    if (payload.description) {
      data.description = payload.description;
    }

    if (payload.body) {
      data.body = payload.body;
    }

    await this.prisma.article.update({
      where: { id: existing.id },
      data,
    });

    const article = await this.getArticleRecord(newSlug);
    return this.buildSingleArticleResponse(article, userId);
  }

  async deleteArticle(slug: string, userId: string): Promise<void> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException('Cannot delete article');
    }

    await this.prisma.article.delete({
      where: { id: existing.id },
    });
  }

  async favoriteArticle(
    slug: string,
    userId: string,
  ): Promise<SingleArticleResponse> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.favorite.create({
          data: {
            userId,
            articleId: article.id,
          },
        }),
        this.prisma.article.update({
          where: { id: article.id },
          data: {
            favoritesCount: {
              increment: 1,
            },
          },
        }),
      ]);
    }

    return this.getArticle(slug, userId);
  }

  async unfavoriteArticle(
    slug: string,
    userId: string,
  ): Promise<SingleArticleResponse> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const result = await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId: article.id,
      },
    });

    if (result.count > 0) {
      await this.prisma.article.update({
        where: { id: article.id },
        data: {
          favoritesCount: {
            decrement: result.count,
          },
        },
      });
    }

    return this.getArticle(slug, userId);
  }

  private async getArticleRecord(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: ARTICLE_SELECT,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private buildSingleArticleResponse(
    article: ArticleWithRelations,
    currentUserId: string | null,
  ): SingleArticleResponse {
    return {
      article: this.buildArticleDto(article, currentUserId),
    };
  }

  private buildArticleDto(
    article: ArticleWithRelations,
    currentUserId: string | null,
  ): ArticleDto {
    const tagList = article.tags.map(({ tag }) => tag.name);
    const favorited = currentUserId
      ? article.favorites.some(({ userId }) => userId === currentUserId)
      : false;
    const following = currentUserId
      ? article.author.followers.some(
          ({ followerId }) => followerId === currentUserId,
        )
      : false;

    const authorProfile = this.profilesService.buildProfileDto(
      article.author.username,
      article.author.bio ?? null,
      article.author.image ?? null,
      following,
    );

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body ?? '',
      tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favoritesCount,
      author: authorProfile,
    };
  }

  private sanitizeTagList(tagList?: string[]): string[] {
    if (!tagList || !tagList.length) {
      return [];
    }

    const unique = new Set<string>();

    for (const tag of tagList) {
      const trimmed = tag.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }

    return Array.from(unique.values());
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true });
    let slug = base || slugId();
    let attempt = 0;

    while (true) {
      const existing = await this.prisma.article.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      attempt += 1;
      slug = `${base}-${slugId()}`;

      if (attempt > 5) {
        slug = `${base}-${slugId()}${slugId()}`;
      }
    }
  }
}
