import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import type {
  MultipleArticlesResponse,
  SingleArticleResponse,
} from './dto/article-response.dto';
import { UserEntity } from '../users/entities/user.entity';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock(
  'nanoid/non-secure',
  () => ({
    customAlphabet: () => () => 'slugid',
  }),
  { virtual: true },
);

const mockUser: UserEntity = {
  id: 'user-42',
  email: 'user42@example.com',
  username: 'user42',
  password: 'hashed-password',
  bio: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleSingleArticleResponse: SingleArticleResponse = {
  article: {
    slug: 'test-slug',
    title: 'Test Title',
    description: 'Test Description',
    body: 'Test Body',
    tagList: ['test'],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: {
      username: 'author',
      bio: null,
      image: null,
      following: false,
    },
  },
};

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let articlesService: jest.Mocked<ArticlesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: {
            findAll: jest.fn(),
            findFeed: jest.fn(),
            getArticle: jest.fn(),
            createArticle: jest.fn(),
            updateArticle: jest.fn(),
            deleteArticle: jest.fn(),
            favoriteArticle: jest.fn(),
            unfavoriteArticle: jest.fn(),
          } satisfies Partial<jest.Mocked<ArticlesService>>,
        },
      ],
    }).compile();

    articlesService = module.get<jest.Mocked<ArticlesService>>(ArticlesService);
    controller = module.get<ArticlesController>(ArticlesController);
  });

  describe('findAll', () => {
    it('delegates to ArticlesService.findAll with query and user context', async () => {
      const inputQuery: ArticlesQueryDto = {
        tag: 'angular',
        limit: 10,
        offset: 0,
      };

      const expectedResponse: MultipleArticlesResponse = {
        articles: [],
        articlesCount: 0,
      };
      articlesService.findAll.mockResolvedValue(expectedResponse);

      const actualArticles = await controller.findAll(inputQuery, mockUser);

      expect(actualArticles).toEqual(expectedResponse);
      expect(articlesService.findAll.mock.calls[0]).toEqual([
        inputQuery,
        mockUser.id,
      ]);
    });
  });

  describe('getFeed', () => {
    it('should delegate to ArticlesService.findFeed and return the articles for feed section', async () => {
      const inputQuery: ArticlesQueryDto = {
        tag: 'angular',
        limit: 10,
        offset: 0,
      };

      const expectedResponse: MultipleArticlesResponse = {
        articles: [],
        articlesCount: 0,
      };
      articlesService.findFeed.mockResolvedValue(expectedResponse);

      const actualArticles = await controller.getFeed(inputQuery, mockUser);

      expect(actualArticles).toEqual(expectedResponse);
      expect(articlesService.findFeed.mock.calls[0]).toEqual([
        inputQuery,
        mockUser.id,
      ]);
    });
  });

  describe('getArticle', () => {
    it('should delegate to ArticlesService.getArticle and return the article', async () => {
      const inputUser = mockUser;
      const inputSlug = 'test-slug';
      const expectedArticle = sampleSingleArticleResponse;
      articlesService.getArticle.mockResolvedValue(expectedArticle);

      const actualArticle = await controller.getArticle(inputSlug, inputUser);

      expect(actualArticle).toEqual(expectedArticle);
      expect(articlesService.getArticle).toHaveBeenCalledWith(
        inputSlug,
        inputUser.id,
      );
    });
  });

  describe('createArticle', () => {
    it('should delegate to ArticlesService.createArticle and return the article', async () => {
      const article = sampleSingleArticleResponse;
      const dto = {
        article: {
          title: 'Test',
          description: 'Desc',
          body: 'Body',
          tagList: [],
        },
      };
      articlesService.createArticle.mockResolvedValue(article);

      const result = await controller.createArticle(mockUser, dto);
      expect(result).toEqual(article);
      expect(articlesService.createArticle).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
    });
  });

  describe('updateArticle', () => {
    it('should delegate to ArticlesService.updateArticle and return the article', async () => {
      const article = sampleSingleArticleResponse;
      const dto = {
        article: { title: 'Updated' },
      };
      articlesService.updateArticle.mockResolvedValue(article);

      const result = await controller.updateArticle('test-slug', mockUser, dto);
      expect(result).toEqual(article);
      expect(articlesService.updateArticle).toHaveBeenCalledWith(
        'test-slug',
        mockUser.id,
        dto,
      );
    });
  });

  describe('deleteArticle', () => {
    it('should delegate to ArticlesService.deleteArticle', async () => {
      articlesService.deleteArticle.mockResolvedValue(undefined);

      const result = await controller.deleteArticle('test-slug', mockUser);
      expect(result).toBeUndefined();
      expect(articlesService.deleteArticle).toHaveBeenCalledWith(
        'test-slug',
        mockUser.id,
      );
    });
  });

  describe('favoriteArticle', () => {
    it('should delegate to ArticlesService.favoriteArticle and return the article', async () => {
      const article = sampleSingleArticleResponse;
      articlesService.favoriteArticle.mockResolvedValue(article);

      const result = await controller.favorite('test-slug', mockUser);
      expect(result).toEqual(article);
      expect(articlesService.favoriteArticle).toHaveBeenCalledWith(
        'test-slug',
        mockUser.id,
      );
    });
  });

  describe('unfavoriteArticle', () => {
    it('should delegate to ArticlesService.unfavoriteArticle and return the article', async () => {
      const article = sampleSingleArticleResponse;
      articlesService.unfavoriteArticle.mockResolvedValue(article);

      const result = await controller.unfavorite('test-slug', mockUser);
      expect(result).toEqual(article);
      expect(articlesService.unfavoriteArticle).toHaveBeenCalledWith(
        'test-slug',
        mockUser.id,
      );
    });
  });
});
