import { OrderStatus } from '@prisma/client';

const API_STATUS: Partial<Record<OrderStatus, string>> = {
  CREATED: 'created',
  PAID: 'paid',
  SETTLED: 'settled',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partially_filled',
  FILLED: 'filled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export function orderStatusToApi(status: OrderStatus): string {
  return API_STATUS[status] ?? status.toLowerCase();
}

export type PrimaryOrderResponse = {
  orderId: string;
  releaseId: string;
  roundId: string;
  units: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  pricePerUnit: string;
  status: string;
  idempotentReplay?: true;
};

export function mapPrimaryOrderResponse(params: {
  orderId: string;
  releaseId: string;
  roundId: string;
  units: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  pricePerUnit: string;
  status: OrderStatus;
  idempotentReplay?: boolean;
}): PrimaryOrderResponse {
  return {
    orderId: params.orderId,
    releaseId: params.releaseId,
    roundId: params.roundId,
    units: params.units,
    grossAmount: params.grossAmount,
    feeAmount: params.feeAmount,
    netAmount: params.netAmount,
    pricePerUnit: params.pricePerUnit,
    status: orderStatusToApi(params.status),
    ...(params.idempotentReplay ? { idempotentReplay: true as const } : {}),
  };
}
