import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AddSupportMessageDto } from './dto/add-support-message.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UserSupportService } from './user-support.service';

@Controller('api/v1/support/tickets')
@UseGuards(JwtAuthGuard)
export class UserSupportController {
  constructor(private readonly support: UserSupportService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateSupportTicketDto) {
    return this.support.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.support.list(user.id, query.page, query.pageSize);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.support.getById(user.id, id);
  }

  @Post(':id/messages')
  addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddSupportMessageDto,
  ) {
    return this.support.addMessage(user.id, id, body.body);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.support.close(user.id, id);
  }
}
