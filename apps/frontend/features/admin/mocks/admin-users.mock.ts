export type AdminUserStatus =
  | "ACTIVE"
  | "PENDING_EMAIL_VERIFICATION"
  | "SUSPENDED"
  | "BANNED";

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  status: AdminUserStatus;
  availableBalanceUsdt: string;
  lockedBalanceUsdt: string;
  totalHoldingsUnits: string;
  createdAt: string;
  lastActivityAt: string;
};

export const MOCK_ADMIN_USERS: AdminUserListItem[] = [
  {
    id: "usr-1001",
    email: "holder@example.com",
    name: "Alex Holder",
    roles: ["INVESTOR", "USER"],
    status: "ACTIVE",
    availableBalanceUsdt: "1 240.00",
    lockedBalanceUsdt: "200.00",
    totalHoldingsUnits: "450",
    createdAt: "2025-11-02",
    lastActivityAt: "2026-05-29",
  },
  {
    id: "usr-1002",
    email: "danila.chat27@gmail.com",
    name: "Danila",
    roles: ["SUPER_ADMIN", "INVESTOR"],
    status: "ACTIVE",
    availableBalanceUsdt: "8 500.00",
    lockedBalanceUsdt: "0.00",
    totalHoldingsUnits: "1 200",
    createdAt: "2025-10-15",
    lastActivityAt: "2026-05-30",
  },
  {
    id: "usr-1003",
    email: "compliance.case@example.com",
    name: null,
    roles: ["USER"],
    status: "SUSPENDED",
    availableBalanceUsdt: "0.00",
    lockedBalanceUsdt: "3 400.00",
    totalHoldingsUnits: "80",
    createdAt: "2026-01-20",
    lastActivityAt: "2026-04-10",
  },
];
