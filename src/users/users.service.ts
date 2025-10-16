import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserResponse } from './dto/user-response.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  readonly userResponseSelect = {
    id: true,
    email: true,
    username: true,
    bio: true,
    image: true,
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  buildUserResponse(
    user: Pick<UserEntity, 'id' | 'email' | 'username' | 'bio' | 'image'>,
  ): UserResponse {
    return {
      user: {
        email: user.email,
        token: this.generateToken(user),
        username: user.username,
        bio: user.bio ?? null,
        image: user.image ?? null,
      },
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserResponse> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        password: true,
      },
    });

    if (!current) {
      throw new NotFoundException('User not found');
    }

    const payload = dto.user;
    const data: Prisma.UserUpdateInput = {};

    if (payload.email && payload.email !== current.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== userId) {
        throw new ConflictException('Email already registered');
      }
      data.email = payload.email;
    }

    if (payload.username && payload.username !== current.username) {
      const usernameOwner = await this.prisma.user.findUnique({
        where: { username: payload.username },
        select: { id: true },
      });
      if (usernameOwner && usernameOwner.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      data.username = payload.username;
    }

    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 10);
    }

    if (payload.bio !== undefined) {
      data.bio = payload.bio ?? null;
    }

    if (payload.image !== undefined) {
      data.image = payload.image ?? null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.userResponseSelect,
    });

    return this.buildUserResponse(updated);
  }

  private generateToken(user: Pick<UserEntity, 'id' | 'email'>): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }
}
