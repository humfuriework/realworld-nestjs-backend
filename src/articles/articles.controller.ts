import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query() query: ArticlesQueryDto,
    @CurrentUser() user: UserEntity | null,
  ) {
    return this.articlesService.findAll(query, user?.id ?? null);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(@Query() query: ArticlesQueryDto, @CurrentUser() user: UserEntity) {
    return this.articlesService.findFeed(query, user.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  getArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserEntity | null,
  ) {
    return this.articlesService.getArticle(slug, user?.id ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createArticle(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articlesService.createArticle(user.id, dto);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  updateArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(slug, user.id, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  deleteArticle(@Param('slug') slug: string, @CurrentUser() user: UserEntity) {
    return this.articlesService.deleteArticle(slug, user.id);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  favorite(@Param('slug') slug: string, @CurrentUser() user: UserEntity) {
    return this.articlesService.favoriteArticle(slug, user.id);
  }

  @Delete(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  unfavorite(@Param('slug') slug: string, @CurrentUser() user: UserEntity) {
    return this.articlesService.unfavoriteArticle(slug, user.id);
  }
}
