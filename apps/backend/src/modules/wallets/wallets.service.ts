import { Injectable } from "@nestjs/common";
import { WalletsRepository } from "./wallets.repository";

@Injectable()
export class WalletsService {
  constructor(private readonly walletsRepository: WalletsRepository) {}

  getStatus() {
    void this.walletsRepository;
    return { module: "wallets", ready: false };
  }
}
