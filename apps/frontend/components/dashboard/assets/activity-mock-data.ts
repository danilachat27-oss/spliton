export type ActivityKind =
  | "deposit"
  | "purchase"
  | "sale"
  | "transfer"
  | "withdrawal"
  | "secondary";

export type ActivityStatus = "Completed" | "Pending" | "Processing" | "Cancelled";

export type ActivityRecord = {
  id: string;
  date: string;
  type: string;
  /** i18n key suffix used when building labels dynamically (live). */
  typeKey?: string;
  kind: ActivityKind;
  release: string;
  units: string;
  amount: string;
  status: ActivityStatus;
  txId: string;
  details: string;
  /** i18n key suffix used when building details labels dynamically (live). */
  detailsKey?: string;
  relative: string;
  /** i18n key suffix for relative time labels (live). */
  relativeKey?: string;
};

export const activityRecords: ActivityRecord[] = [
  {
    id: "a-001",
    date: "19.04.2026 11:42",
    type: "Deposit received",
    typeKey: "deposit_received",
    kind: "deposit",
    release: "—",
    units: "—",
    amount: "+450 USDT",
    status: "Completed",
    txId: "TX-9K2A-11",
    details: "USDT (TRC20) top-up confirmed",
    detailsKey: "deposit_confirmed",
    relative: "2 hours ago",
    relativeKey: "hours_2",
  },
  {
    id: "a-002",
    date: "19.04.2026 10:12",
    type: "Units purchase",
    typeKey: "units_purchase",
    kind: "purchase",
    release: "Offset",
    units: "+1 200",
    amount: "-320 USDT",
    status: "Completed",
    txId: "TX-4M1S-22",
    details: "Open round entry",
    detailsKey: "open_round_entry",
    relative: "3 hours ago",
    relativeKey: "hours_3",
  },
  {
    id: "a-003",
    date: "18.04.2026 21:40",
    type: "Listing created",
    typeKey: "listing_created",
    kind: "secondary",
    release: "Midnight Drive",
    units: "400",
    amount: "—",
    status: "Completed",
    txId: "TX-7L0D-31",
    details: "Secondary listing posted",
    detailsKey: "secondary_listing",
    relative: "yesterday",
    relativeKey: "yesterday",
  },
  {
    id: "a-004",
    date: "18.04.2026 18:25",
    type: "Transfer",
    typeKey: "transfer",
    kind: "transfer",
    release: "Glass Echo",
    units: "-180",
    amount: "—",
    status: "Completed",
    txId: "TX-3Q8F-44",
    details: "Units transfer to user #204",
    detailsKey: "transfer_to_user",
    relative: "yesterday",
    relativeKey: "yesterday",
  },
  {
    id: "a-005",
    date: "18.04.2026 14:18",
    type: "Withdrawal request",
    typeKey: "withdrawal_request",
    kind: "withdrawal",
    release: "—",
    units: "—",
    amount: "-120 USDT",
    status: "Processing",
    txId: "TX-2P6B-51",
    details: "Review in progress",
    detailsKey: "review_in_progress",
    relative: "yesterday",
    relativeKey: "yesterday",
  },
  {
    id: "a-006",
    date: "17.04.2026 19:11",
    type: "Secondary trade",
    typeKey: "secondary_trade",
    kind: "secondary",
    release: "Low Horizon",
    units: "-260",
    amount: "+94 USDT",
    status: "Completed",
    txId: "TX-8J9R-63",
    details: "Matched on secondary market",
    detailsKey: "secondary_matched",
    relative: "2 days ago",
    relativeKey: "days_2",
  },
  {
    id: "a-007",
    date: "17.04.2026 13:05",
    type: "Units sale",
    typeKey: "units_sale",
    kind: "sale",
    release: "Offset",
    units: "-320",
    amount: "+88 USDT",
    status: "Completed",
    txId: "TX-6D2N-74",
    details: "Partial position decrease",
    detailsKey: "partial_decrease",
    relative: "2 days ago",
    relativeKey: "days_2",
  },
];
