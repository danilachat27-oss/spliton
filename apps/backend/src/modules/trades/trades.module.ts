import { Module } from "@nestjs/common";
import { TradesController } from "./trades.controller";
import { TradesRepository } from "./trades.repository";
import { TradesService } from "./trades.service";

@Module({
  controllers: [TradesController],
  providers: [TradesService, TradesRepository],
})
export class TradesModule {}
