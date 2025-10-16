import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ProfilesModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
