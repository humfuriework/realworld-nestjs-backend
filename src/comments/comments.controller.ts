import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Param('slug') slug: string, @CurrentUser() user: UserEntity | null) {
    return this.commentsService.getComments(slug, user?.id ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('slug') slug: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.addComment(slug, user.id, dto);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('slug') slug: string,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.commentsService.deleteComment(slug, commentId, user.id);
  }
}
