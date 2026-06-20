import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { RequestStatementDto } from './dto/request-statement.dto';
import { UserAccountingService } from './user-accounting.service';

@Controller('api/v1/accounting/statements')
@UseGuards(JwtAuthGuard)
export class UserAccountingController {
  constructor(private readonly accounting: UserAccountingService) {}

  @Get()
  listKinds() {
    return this.accounting.listAvailableStatements();
  }

  @Post('request')
  request(@CurrentUser() user: AuthUser, @Body() body: RequestStatementDto) {
    return this.accounting.requestStatement({ userId: user.id, ...body });
  }

  @Get('requests/:id')
  requestStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accounting.getRequestStatus(user.id, id);
  }
}
