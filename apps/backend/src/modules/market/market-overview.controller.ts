import { Controller, Get, Param, Query } from '@nestjs/common';

import { MarketOverviewFeedQueryDto, MarketOverviewTopReleasesQueryDto } from './dto/market-overview-feed-query.dto';

import { MarketOverviewQueryDto } from './dto/market-overview-query.dto';

import { MarketOverviewService } from './market-overview.service';



@Controller('api/v1/market/overview')

export class MarketOverviewController {

  constructor(private readonly overview: MarketOverviewService) {}



  @Get('summary')

  summary(@Query('period') period?: string) {

    return this.overview.getSummary(period ?? '7d');

  }



  @Get('stats')

  stats(@Query('period') period?: string) {

    return this.overview.getStats(period ?? '7d');

  }



  @Get('timeseries')

  timeseries(@Query('period') period?: string) {

    return this.overview.getTimeseries(period ?? '30d');

  }



  @Get('charts')

  charts(@Query('period') period?: string) {

    return this.overview.getCharts(period ?? '30d');

  }



  @Get('top-releases')

  topReleases(@Query() query: MarketOverviewTopReleasesQueryDto) {

    return this.overview.getTopReleases(query);

  }



  @Get('listings')

  listings(@Query() query: MarketOverviewFeedQueryDto) {

    return this.overview.getListings(query);

  }



  @Get('trades')

  trades(@Query() query: MarketOverviewFeedQueryDto) {

    return this.overview.getTrades(query);

  }



  @Get('depth')

  depth(@Query('period') period?: string) {

    return this.overview.getDepth(period ?? '7d');

  }



  @Get('price-history')

  priceHistory(@Query('period') period?: string) {

    return this.overview.getPriceHistory(period ?? '30d');

  }



  @Get('releases')

  releases(@Query() query: MarketOverviewQueryDto) {

    return this.overview.getOverview(query);

  }



  @Get()

  list(@Query() query: MarketOverviewQueryDto) {

    return this.overview.getOverview(query);

  }



  @Get(':releaseId')

  detail(

    @Param('releaseId') releaseId: string,

    @Query() query: MarketOverviewQueryDto,

  ) {

    return this.overview.getDetail(releaseId, query);

  }

}


