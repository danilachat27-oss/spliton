import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ArtistPortalController } from './artist-portal.controller';
import { ArtistPortalService } from './artist-portal.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ArtistPortalController],
  providers: [ArtistPortalService],
  exports: [ArtistPortalService],
})
export class ArtistModule {}
