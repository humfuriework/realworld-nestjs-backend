import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import type { ProfileResponse } from './dto/profile-response.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(
    @Param('username') username: string,
    @CurrentUser() user: UserEntity | null,
  ): Promise<ProfileResponse> {
    return this.profilesService.getProfile(username, user?.id ?? null);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  follow(
    @Param('username') username: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProfileResponse> {
    return this.profilesService.follow(username, user.id);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(
    @Param('username') username: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProfileResponse> {
    return this.profilesService.unfollow(username, user.id);
  }
}
