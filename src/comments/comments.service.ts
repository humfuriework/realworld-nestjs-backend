import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Prisma as PrismaNS } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import type {
  CommentDto,
  MultipleCommentsResponse,
  SingleCommentResponse,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

const COMMENT_SELECT = PrismaNS.validator<Prisma.CommentSelect>()({
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
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
});

type CommentWithAuthor = Prisma.CommentGetPayload<{
  select: typeof COMMENT_SELECT;
}>;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async getComments(
    slug: string,
    currentUserId: string | null,
  ): Promise<MultipleCommentsResponse> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      select: COMMENT_SELECT,
    });

    return {
      comments: comments.map((comment) =>
        this.buildCommentDto(comment, currentUserId),
      ),
    };
  }

  async addComment(
    slug: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<SingleCommentResponse> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.comment.body,
        articleId: article.id,
        authorId,
      },
      select: COMMENT_SELECT,
    });

    return {
      comment: this.buildCommentDto(comment, authorId),
    };
  }

  async deleteComment(
    slug: string,
    commentId: number,
    userId: string,
  ): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        articleId: article.id,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Cannot delete comment');
    }

    await this.prisma.comment.delete({
      where: { id: comment.id },
    });
  }

  private buildCommentDto(
    comment: CommentWithAuthor,
    currentUserId: string | null,
  ): CommentDto {
    const following = currentUserId
      ? comment.author.followers.some(
          ({ followerId }) => followerId === currentUserId,
        )
      : false;

    const authorProfile = this.profilesService.buildProfileDto(
      comment.author.username,
      comment.author.bio ?? null,
      comment.author.image ?? null,
      following,
    );

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: authorProfile,
    };
  }
}
