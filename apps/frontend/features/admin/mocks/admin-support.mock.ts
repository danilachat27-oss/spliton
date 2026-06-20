export type AdminTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "escalated"
  | "closed";

export type AdminTicketListItem = {
  id: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: AdminTicketStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export const MOCK_ADMIN_TICKETS: AdminTicketListItem[] = [
  {
    id: "tkt-401",
    userEmail: "holder@example.com",
    subject: "Deposit not credited",
    category: "transaction",
    priority: "high",
    status: "open",
    assignedTo: null,
    createdAt: "2026-05-30",
    updatedAt: "2026-05-30",
  },
];
