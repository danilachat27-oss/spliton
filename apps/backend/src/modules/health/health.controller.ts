import { Controller, Get, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  getLive() {
    return this.healthService.getLive();
  }

  @Get('ready')
  getReady() {
    return this.healthService.getReady();
  }

  @Get('db')
  getDbHealth() {
    return this.healthService.getDbHealth();
  }

  @Get('deep')
  getDeep(@Headers('x-health-token') token?: string) {
    return this.healthService.getDeep(token);
  }
}
