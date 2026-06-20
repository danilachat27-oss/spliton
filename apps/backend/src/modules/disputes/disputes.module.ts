import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OperatorSlaModule } from '../operator-sla/operator-sla.module';
import { UserDisputesController } from './user-disputes.controller';
import { UserDisputesService } from './user-disputes.service';

@Module({
  imports: [PrismaModule, AuthModule, OperatorSlaModule],
  controllers: [UserDisputesController],
  providers: [UserDisputesService],
})
export class DisputesModule {}
