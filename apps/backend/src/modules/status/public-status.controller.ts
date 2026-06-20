import { Controller, Get } from '@nestjs/common';

import { PublicStatusService } from './public-status.service';

@Controller('api/v1/system-status')
export class PublicStatusController {
  constructor(private readonly status: PublicStatusService) {}

  @Get()
  snapshot() {
    return this.status.snapshot();
  }

  @Get('incidents')
  incidents() {
    return this.status.listIncidents();
  }
}
