import type { PayoutHistoryRow, PayoutScheduleRow } from "@/components/dashboard/assets/payouts-mock-data";

type TFn = (key: string) => string;

export function payoutHistoryTypeLabel(type: PayoutHistoryRow["type"], t: TFn): string {
  return t(`history.type.${type}`);
}

export function payoutHistoryStatusLabel(status: PayoutHistoryRow["status"], t: TFn): string {
  return t(`history.status.${status}`);
}

export function payoutScheduleStatusLabel(status: PayoutScheduleRow["status"], t: TFn): string {
  return t(`payouts.schedule.status.${status}`);
}
