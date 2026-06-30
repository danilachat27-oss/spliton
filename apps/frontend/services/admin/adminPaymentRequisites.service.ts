import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";

export type DepositNetworkSettings = {
  id: string;
  asset: string;
  network: string;
  networkDisplayName: string | null;
  tokenContractAddress: string | null;
  minDepositAmount: string;
  maxDepositAmount: string | null;
  minConfirmations: number;
  estimatedCreditTimeMinutes: number;
  withdrawAvailableAfterMinutes: number;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  status: string;
  poolLowThreshold: number;
  providerMode: string;
  providerName: string | null;
  explorerTxUrlTemplate: string | null;
  explorerAddressUrlTemplate: string | null;
  explorerTokenUrlTemplate: string | null;
  userWarningRu: string | null;
  userWarningEn: string | null;
  userWarningEs: string | null;
  userWarningPt: string | null;
  maintenanceMessageRu: string | null;
  maintenanceMessageEn: string | null;
  maintenanceMessageEs: string | null;
  maintenanceMessagePt: string | null;
  instructionsRu: string | null;
  instructionsEn: string | null;
  instructionsEs: string | null;
  instructionsPt: string | null;
};

export type PoolRow = {
  id: string;
  address: string;
  status: string;
  assignedUserId: string | null;
  assignedAt: string | null;
  createdByUserId: string | null;
  createdAt: string;
  disabledAt: string | null;
  disableReason: string | null;
};

export type PoolList = {
  items: PoolRow[];
  total: number;
  availableCount: number;
  assignedCount: number;
  disabledCount: number;
  archivedCount: number;
  lowThreshold?: number;
  poolLowWarning?: boolean;
};

export type RequisiteHistoryItem = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
  actorUserId: string | null;
  actorRole: string | null;
  reason: string | null;
  createdAt: string;
};

export type DepositPreview = {
  previewMode: boolean;
  depositEnabled: boolean;
  asset: string;
  network: string;
  networkDisplayName: string;
  address: string;
  addressNote: string;
  qrDataUrl: string;
  minDepositAmount: string;
  maxDepositAmount: string | null;
  userWarnings: string[];
  depositInstructions: string | null;
  maintenanceMessage: string | null;
};

const BASE = ADMIN_API_PATHS.paymentRequisites;

export async function fetchPaymentRequisitesSummary(
  get: <T>(path: string) => Promise<T>,
) {
  return get<{ settings: DepositNetworkSettings; pool: PoolList }>(BASE);
}

export async function patchNetworkSettings(
  patch: Partial<DepositNetworkSettings> & { reason?: string },
  patchFn: <T>(path: string, body: unknown) => Promise<T>,
) {
  return patchFn<DepositNetworkSettings>(`${BASE}/network-settings`, patch);
}

export async function fetchAddressPool(get: <T>(path: string) => Promise<T>) {
  return get<PoolList>(`${BASE}/address-pool`);
}

export async function addPoolAddress(
  body: { address: string; reason: string },
  post: <T>(path: string, payload: unknown) => Promise<T>,
) {
  return post(`${BASE}/address-pool`, { ...body, asset: "USDT", network: "TRC20" });
}

export async function bulkAddPoolAddresses(
  body: { addresses: string[]; reason: string },
  post: <T>(path: string, payload: unknown) => Promise<T>,
) {
  return post(`${BASE}/address-pool/bulk`, { ...body, asset: "USDT", network: "TRC20" });
}

export async function poolAction(
  id: string,
  action: "disable" | "enable" | "archive",
  body: { reason: string; compromised?: boolean },
  post: <T>(path: string, payload: unknown) => Promise<T>,
) {
  return post(`${BASE}/address-pool/${id}/${action}`, body);
}

export async function fetchDepositPreview(
  get: <T>(path: string) => Promise<T>,
  lang: string,
) {
  return get<DepositPreview>(`${BASE}/preview?lang=${encodeURIComponent(lang)}`);
}

export async function fetchRequisiteHistory(get: <T>(path: string) => Promise<T>) {
  return get<{ items: RequisiteHistoryItem[] }>(`${BASE}/history?limit=30`);
}
