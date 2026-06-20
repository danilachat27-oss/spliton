import { Controller, Get } from '@nestjs/common';
import { PublicPlatformFeesService } from './public-platform-fees.service';

@Controller('api/v1/platform')
export class PublicPlatformFeesController {
  constructor(private readonly fees: PublicPlatformFeesService) {}

  @Get('fees')
  getFees() {
    return this.fees.getPublicFees();
  }
}
