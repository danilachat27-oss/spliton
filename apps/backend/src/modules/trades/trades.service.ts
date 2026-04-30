import { Injectable } from '@nestjs/common';
import { TradesRepository } from './trades.repository';

@Injectable()
export class TradesService {
  constructor(private readonly tradesRepository: TradesRepository) {}

  getStatus() {
    void this.tradesRepository;
    return { module: 'trades', ready: false };
  }
}
