import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../../common/cache/cache.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicAnnouncementsController } from './public-announcements.controller';
import { PublicAnnouncementsService } from './public-announcements.service';

@Module({
  imports: [PrismaModule, CacheModule, AuthModule],
  controllers: [PublicAnnouncementsController],
  providers: [PublicAnnouncementsService],
  exports: [PublicAnnouncementsService],
})
export class AnnouncementsModule {}
