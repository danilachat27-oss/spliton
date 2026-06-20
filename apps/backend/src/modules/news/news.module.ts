import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicNewsController } from './public-news.controller';
import { PublicNewsService } from './public-news.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicNewsController],
  providers: [PublicNewsService],
})
export class NewsModule {}
