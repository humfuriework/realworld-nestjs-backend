import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ProfileDto, ProfileResponse } from './dto/profile-response.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(
    username: string,
    currentUserId: string | null,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true },
            }
          : undefined,
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const following = currentUserId
      ? Boolean(
          user.followers?.some(
            (follower) => follower.followerId === currentUserId,
          ),
        )
      : false;

    return this.buildProfileResponse(
      user.username,
      user.bio ?? null,
      user.image ?? null,
      following,
    );
  }

  async follow(username: string, followerId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    if (user.id === followerId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followedId: {
          followerId,
          followedId: user.id,
        },
      },
      update: {},
      create: {
        followerId,
        followedId: user.id,
      },
    });

    return this.buildProfileResponse(
      user.username,
      user.bio ?? null,
      user.image ?? null,
      true,
    );
  }

  async unfollow(
    username: string,
    followerId: string,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    if (user.id === followerId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followedId: user.id,
      },
    });

    const following = await this.prisma.follow.findUnique({
      where: {
        followerId_followedId: {
          followerId,
          followedId: user.id,
        },
      },
    });

    return this.buildProfileResponse(
      user.username,
      user.bio ?? null,
      user.image ?? null,
      Boolean(following),
    );
  }

  buildProfileDto(
    username: string,
    bio: string | null,
    image: string | null,
    following: boolean,
  ): ProfileDto {
    return {
      username,
      bio,
      image,
      following,
    };
  }

  private buildProfileResponse(
    username: string,
    bio: string | null,
    image: string | null,
    following: boolean,
  ): ProfileResponse {
    return {
      profile: this.buildProfileDto(username, bio, image, following),
    };
  }
}
