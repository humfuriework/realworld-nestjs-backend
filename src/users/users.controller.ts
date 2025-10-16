import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCurrent(
    @CurrentUser() user: UserEntity,
  ): ReturnType<UsersService['buildUserResponse']> {
    return this.usersService.buildUserResponse(user);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateCurrent(
    @CurrentUser() user: UserEntity,
    @Body() body: UpdateUserDto,
  ): Promise<ReturnType<UsersService['buildUserResponse']>> {
    return this.usersService.updateUser(user.id, body);
  }
}
