import { Body, Controller, Get, Post } from '@nestjs/common';
import { ServicesCalculatorService } from './services-calculator.service';
import { CalculatorPreviewDto } from './dto/calculator-preview.dto';

@Controller('api/v1/services/calculator')
export class ServicesCalculatorController {
  constructor(private readonly calculator: ServicesCalculatorService) {}

  @Get('config')
  getConfig() {
    return this.calculator.getConfig();
  }

  @Post('preview')
  preview(@Body() body: CalculatorPreviewDto) {
    return this.calculator.preview(body);
  }
}
