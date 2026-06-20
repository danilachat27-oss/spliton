export type AdminAuditListItem = {
  id: string;
  adminEmail: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  before: string | null;
  after: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
};

export const MOCK_ADMIN_AUDIT: AdminAuditListItem[] = [
  {
    id: "aud-9001",
    adminEmail: "danila.chat27@gmail.com",
    role: "SUPER_ADMIN",
    action: "user.role_assign",
    entity: "user",
    entityId: "usr-1002",
    before: '["INVESTOR"]',
    after: '["SUPER_ADMIN","INVESTOR"]',
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    createdAt: "2026-05-30T10:00:00Z",
  },
  {
    id: "aud-9002",
    adminEmail: "finance@spliton.io",
    role: "ACCOUNTANT",
    action: "withdrawal.approve",
    entity: "withdrawal",
    entityId: "wd-4401",
    before: '{"status":"pending"}',
    after: '{"status":"approved","result":"success"}',
    ip: "10.0.0.12",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    createdAt: "2026-05-30T09:42:00Z",
  },
  {
    id: "aud-9003",
    adminEmail: "compliance@spliton.io",
    role: "COMPLIANCE",
    action: "compliance.operation.freeze",
    entity: "withdrawal",
    entityId: "wd-4398",
    before: '{"status":"pending"}',
    after: '{"status":"on_hold","result":"success"}',
    ip: "10.0.0.18",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    createdAt: "2026-05-29T16:20:00Z",
  },
  {
    id: "aud-9004",
    adminEmail: "content@spliton.io",
    role: "CONTENT_MANAGER",
    action: "round.update",
    entity: "round",
    entityId: "rnd-220",
    before: '{"status":"draft"}',
    after: '{"status":"preview","result":"success"}',
    ip: "10.0.0.5",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    createdAt: "2026-05-29T11:05:00Z",
  },
  {
    id: "aud-9005",
    adminEmail: "support@spliton.io",
    role: "SUPPORT_MANAGER",
    action: "support_ticket.status_change",
    entity: "support_ticket",
    entityId: "tkt-881",
    before: '{"status":"open"}',
    after: '{"status":"in_progress","result":"success"}',
    ip: "10.0.0.9",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    createdAt: "2026-05-28T14:30:00Z",
  },
  {
    id: "aud-9006",
    adminEmail: "danila.chat27@gmail.com",
    role: "SUPER_ADMIN",
    action: "report.generate",
    entity: "report",
    entityId: "rpt-102",
    before: null,
    after: '{"format":"csv","result":"success"}',
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    createdAt: "2026-05-28T08:15:00Z",
  },
];
