import { Module } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicPlatformFeesController } from './public-platform-fees.controller';
import { PublicPlatformFeesService } from './public-platform-fees.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [PublicPlatformFeesController],
  providers: [PublicPlatformFeesService],
  exports: [PublicPlatformFeesService],
})
export class PlatformPublicModule {}
