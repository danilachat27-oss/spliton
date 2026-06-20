import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ReleaseDataRoomService } from './release-data-room.service';

@Controller('api/v1/releases')
export class ReleaseDataRoomController {
  constructor(private readonly dataRoom: ReleaseDataRoomService) {}

  @Get(':id/data-room')
  @UseGuards(OptionalJwtAuthGuard)
  list(@Param('id') id: string, @CurrentUser() user?: AuthUser | null) {
    return this.dataRoom.listPublic(id, user?.id ?? null);
  }
}
