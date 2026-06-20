import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OperatorSlaService } from './operator-sla.service';

@Module({
  imports: [PrismaModule],
  providers: [OperatorSlaService],
  exports: [OperatorSlaService],
})
export class OperatorSlaModule {}
