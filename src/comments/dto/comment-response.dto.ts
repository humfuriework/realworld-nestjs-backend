import type { ProfileDto } from '../../profiles/dto/profile-response.dto';

export interface CommentDto {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ProfileDto;
}

export interface SingleCommentResponse {
  comment: CommentDto;
}

export interface MultipleCommentsResponse {
  comments: CommentDto[];
}
