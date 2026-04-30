import { Controller, Get } from "@nestjs/common";
import { WalletsService } from "./wallets.service";

@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get("status")
  getStatus() {
    return this.walletsService.getStatus();
  }
}
