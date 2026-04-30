import { Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  getStatus() {
    void this.ordersRepository;
    return { module: 'orders', ready: false };
  }
}
