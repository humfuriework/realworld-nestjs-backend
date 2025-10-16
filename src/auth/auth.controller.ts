import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { UserResponse } from '../users/dto/user-response.dto';

@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  register(@Body() body: RegisterDto): Promise<UserResponse> {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto): Promise<UserResponse> {
    return this.authService.login(body);
  }
}
