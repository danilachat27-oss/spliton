import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ChartReleaseQueryDto } from '../../common/charts/chart-release-query.dto';
import { MarketChartsService } from './market-charts.service';

@Controller('api/v1/market/charts')
export class MarketChartsController {
  constructor(private readonly charts: MarketChartsService) {}

  @Get('price')
  @UseGuards(OptionalJwtAuthGuard)
  price(@Query() query: ChartReleaseQueryDto) {
    return this.charts.getPriceChart(query);
  }

  @Get('ohlc')
  @UseGuards(OptionalJwtAuthGuard)
  ohlc(@Query() query: ChartReleaseQueryDto) {
    return this.charts.getOhlcChart(query);
  }

  @Get('volume')
  @UseGuards(OptionalJwtAuthGuard)
  volume(@Query() query: ChartReleaseQueryDto) {
    return this.charts.getVolumeChart(query);
  }

  @Get('spread')
  @UseGuards(OptionalJwtAuthGuard)
  spread(@Query() query: ChartReleaseQueryDto) {
    return this.charts.getSpreadChart(query);
  }

  @Get('liquidity')
  @UseGuards(OptionalJwtAuthGuard)
  liquidity(@Query() query: ChartReleaseQueryDto) {
    return this.charts.getLiquidityChart(query);
  }
}
