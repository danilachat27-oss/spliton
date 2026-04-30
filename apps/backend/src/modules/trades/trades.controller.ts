import { Controller, Get } from '@nestjs/common';
import { TradesService } from './trades.service';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get('status')
  getStatus() {
    return this.tradesService.getStatus();
  }
}
