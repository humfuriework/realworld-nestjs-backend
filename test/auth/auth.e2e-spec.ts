import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
  });

  describe('/api/users (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123',
            username: 'testuser',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.username).toBe('testuser');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should register without bio', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: 'test2@example.com',
            password: 'password123',
            username: 'testuser2',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe('test2@example.com');
          expect(res.body.user.bio).toBeNull();
        });
    });

    it('should fail with duplicate email', async () => {
      // First registration
      await request(app.getHttpServer()).post('/api/users').send({
        user: {
          email: 'duplicate@example.com',
          password: 'password123',
          username: 'duplicate',
        },
      });

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: 'duplicate@example.com',
            password: 'different',
            username: 'duplicate2',
          },
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('Email already registered');
        });
    });

    it('should hash the password', async () => {
      await request(app.getHttpServer()).post('/api/users').send({
        user: {
          email: 'hash@example.com',
          password: 'mypassword',
          username: 'hashuser',
        },
      });

      // Verify password is hashed in database
      const user = await prisma.user.findUnique({
        where: { email: 'hash@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe('mypassword');
      expect(user?.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });
  });

  describe('/api/users/login (POST)', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer()).post('/api/users').send({
        user: {
          email: 'login@example.com',
          password: 'password123',
          username: 'loginuser',
        },
      });
    });

    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'password123',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user.email).toBe('login@example.com');
          expect(res.body.user.username).toBe('loginuser');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'wrongpassword',
          },
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should not leak information about non-existent users', async () => {
      // Test that the error message is the same for wrong password and non-existent user
      const wrongPasswordResponse = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'login@example.com',
            password: 'wrongpassword',
          },
        });

      const nonExistentUserResponse = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        });

      expect(wrongPasswordResponse.status).toBe(401);
      expect(nonExistentUserResponse.status).toBe(401);
      expect(wrongPasswordResponse.body.message).toBe(
        nonExistentUserResponse.body.message,
      );
    });
  });
});
