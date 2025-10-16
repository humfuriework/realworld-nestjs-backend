import type { ProfileDto } from '../../profiles/dto/profile-response.dto';

export interface ArticleDto {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileDto;
}

export interface SingleArticleResponse {
  article: ArticleDto;
}

export interface MultipleArticlesResponse {
  articles: ArticleDto[];
  articlesCount: number;
}
