import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateDisputeMessageDto } from './dto/create-dispute-message.dto';
import { UserDisputesService } from './user-disputes.service';

@Controller('api/v1/disputes')
@UseGuards(JwtAuthGuard)
export class UserDisputesController {
  constructor(private readonly disputes: UserDisputesService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateDisputeDto) {
    return this.disputes.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.disputes.list(user.id, query.page, query.pageSize);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.disputes.getById(user.id, id);
  }

  @Post(':id/messages')
  addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateDisputeMessageDto,
  ) {
    return this.disputes.addMessage(user.id, id, body.body);
  }
}
