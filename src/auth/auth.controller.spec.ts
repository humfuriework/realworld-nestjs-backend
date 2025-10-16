import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { UserResponse } from '../users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          } satisfies Partial<jest.Mocked<AuthService>>,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should delegate to AuthService and return the user response', async function (this: void) {
      const dto: RegisterDto = {
        user: {
          email: 'jane@example.com',
          username: 'jane',
          password: 'secret123',
          bio: 'About Jane',
          image: 'https://example.com/avatar.png',
        },
      };

      const response: UserResponse = {
        user: {
          email: dto.user.email,
          username: dto.user.username,
          token: 'token',
          bio: dto.user.bio ?? null,
          image: dto.user.image ?? null,
        },
      };

      authService.register.mockResolvedValue(response);

      await expect(controller.register(dto)).resolves.toEqual(response);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should delegate to AuthService and return the user response', async function (this: void) {
      const dto: LoginDto = {
        user: {
          email: 'jane@example.com',
          password: 'secret123',
        },
      };

      const response: UserResponse = {
        user: {
          email: dto.user.email,
          username: 'jane',
          token: 'token',
          bio: null,
          image: null,
        },
      };

      authService.login.mockResolvedValue(response);

      await expect(controller.login(dto)).resolves.toEqual(response);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });
});
