"use client";



import * as React from "react";

import Link from "next/link";

import { ExternalLink, HelpCircle } from "@/lib/lucide";



import {
  AdminDrawerDangerButton,
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { adminBtnGhost, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";

import { Input } from "@/components/ui/input";
import type { AdminComplianceDetail } from "@/features/admin/mocks/admin-compliance.mock";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {

  COMPLIANCE_CONFIRM,

  COMPLIANCE_FIELD_TOOLTIPS,

  complianceEntityLabel,

  complianceEntityPath,

  formatSlaBadge,

} from "@/features/admin/lib/admin-compliance-i18n";

import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";


import { complianceStatusTone } from "@/features/admin/lib/admin-status-maps";

import {

  AdminConfirmDialog,

  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,

  AdminLoadingState,

  AdminRiskBadge,

  AdminStatusBadge,

} from "@/features/admin/ui";

import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";

import { ROUTES } from "@/constants/routes";

import { cn } from "@/lib/utils";



type TabId =

  | "overview"

  | "object"

  | "evidence"

  | "timeline"

  | "notes"

  | "activity"

  | "audit";






export type CompliancePendingAction = {

  action:

    | "reviewed"

    | "dismiss"

    | "freeze"

    | "release"

    | "block"

    | "unblock"

    | "escalate"

    | "note"

    | "assign";

  title: string;

  description: string;

  variant?: "default" | "destructive";

  requireNote?: boolean;

};



type Props = {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  item: AdminComplianceDetail | null;

  loading?: boolean;

  canMutate?: boolean;

  onAction?: (action: CompliancePendingAction, note: string, extra?: string) => Promise<void>;

};



function FieldHint({ text }: { text: string }) {

  return (

    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-relaxed text-zinc-500">

      <HelpCircle className="mt-0.5 size-3 shrink-0" />

      {text}

    </p>

  );

}



function SeverityBadge({ severity }: { severity?: string }) {

  const a = useAdminI18n();
  if (!severity) return <span className="text-xs text-zinc-500">—</span>;

  const tone =

    severity === "critical"

      ? "danger"

      : severity === "high"

        ? "warning"

        : severity === "medium"

          ? "info"

          : "neutral";

  return (

    <AdminStatusBadge label={a.complianceSeverityLabel(severity) ?? severity} tone={tone} />

  );

}



export function AdminComplianceDrawer({

  open,

  onOpenChange,

  item,

  loading,

  canMutate = false,

  onAction,

}: Props) {
  const a = useAdminI18n();

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "object", label: a.t("admin.drawer.compliance.relatedObject") },
    { id: "evidence", label: a.t("admin.drawer.compliance.evidence") },
    { id: "timeline", label: a.t("admin.drawer.compliance.timeline") },
    { id: "notes", label: a.t("admin.drawer.compliance.notes") },
    { id: "activity", label: a.t("admin.drawer.compliance.activity") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];

  const [tab, setTab] = React.useState<TabId>("overview");

  const [note, setNote] = React.useState("");

  const [assignee, setAssignee] = React.useState("");

  const [pending, setPending] = React.useState<CompliancePendingAction | null>(null);

  const dirty = Boolean(note.trim() || assignee.trim());
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open,
    dirty,
    onOpenChange,
  });

  React.useEffect(() => {
    if (open) {

      setTab("overview");

      setNote("");

      setAssignee("");

      setPending(null);

    }

  }, [open, item?.id]);



  async function confirmAction() {

    if (!pending || !onAction) return;

    if (pending.requireNote && !note.trim()) return;

    if (pending.action === "assign" && !assignee.trim()) return;

    await onAction(pending, note.trim(), assignee.trim() || undefined);

    setPending(null);

    setNote("");

  }



  const entityPath = item ? complianceEntityPath(item) : null;

  const sla = item ? formatSlaBadge(item) : null;

  const obj = item?.relatedObject as Record<string, string> | null | undefined;



  return (

    <>

      <AdminDetailDrawer

        open={open}

        onOpenChange={guardedOnOpenChange}

        wide

        widthClassName="w-[min(960px,100vw)]"

        title={

          item

            ? `${item.title ?? item.flagCode ?? a.complianceKindLabel(item.kind) ?? item.kind}`

            : a.t("admin.drawer.compliance.title")

        }

        subtitle={item?.userEmail}

        footer={

          item && canMutate && onAction ? (

            <div className="flex w-full flex-col gap-3">

              <div className="grid gap-3 sm:grid-cols-2">

                <AdminFormField
                  label={a.t("admin.drawer.compliance.adminNote")}
                  htmlFor="cmp-admin-note"
                >
                  <Input
                    id="cmp-admin-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={adminFieldInput}
                    placeholder={a.t("admin.drawer.compliance.adminNotePlaceholder")}
                  />
                </AdminFormField>

                <AdminFormField
                  label={a.t("admin.drawer.compliance.assignee")}
                  htmlFor="cmp-assignee"
                >
                  <Input
                    id="cmp-assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className={adminFieldInput}
                    placeholder="compliance@spliton.demo"
                  />
                </AdminFormField>

              </div>

              <AdminFormFooter
                left={
                  <>
                {item.status === "open" ? (

                  <>

                    <AdminDrawerPrimaryButton onClick={() => setPending({ action: "reviewed", ...COMPLIANCE_CONFIRM.reviewed, requireNote: true })}

                    >

                      Пометить проверенным

                    </AdminDrawerPrimaryButton>

                    <AdminDrawerSecondaryButton

                      onClick={() => setPending({ action: "dismiss", ...COMPLIANCE_CONFIRM.dismiss, requireNote: true })}

                    >

                      False positive

                    </AdminDrawerSecondaryButton>

                  </>

                ) : null}

                {assignee.trim() ? (

                  <AdminDrawerSecondaryButton

                    onClick={() =>

                      setPending({

                        action: "assign",

                        title: "Назначить ответственного?",

                        description: `Кейс будет назначен на ${assignee.trim()}.`,

                      })

                    }

                  >

                    Назначить

                  </AdminDrawerSecondaryButton>

                ) : null}

                {note.trim() ? (

                  <AdminDrawerSecondaryButton

                    onClick={() =>

                      setPending({

                        action: "note",

                        title: "Добавить compliance note?",

                        description: "Заметка будет видна только staff и попадёт в audit.",

                        requireNote: true,

                      })

                    }

                  >

                    Добавить note

                  </AdminDrawerSecondaryButton>

                ) : null}

                <AdminDrawerSecondaryButton

                  onClick={() => setPending({ action: "escalate", ...COMPLIANCE_CONFIRM.escalate })}

                >

                  Эскалировать

                </AdminDrawerSecondaryButton>

                {item.kind !== "user" && !["on_hold", "in_review"].includes(item.status) ? (

                  <AdminDrawerSecondaryButton

                    onClick={() =>

                      setPending({ action: "freeze", ...COMPLIANCE_CONFIRM.freeze, requireNote: true })

                    }

                  >

                    Заморозить

                  </AdminDrawerSecondaryButton>

                ) : null}

                {["on_hold", "in_review"].includes(item.status) ? (

                  <AdminDrawerSecondaryButton

                    onClick={() => setPending({ action: "release", ...COMPLIANCE_CONFIRM.release })}

                  >

                    Снять заморозку

                  </AdminDrawerSecondaryButton>

                ) : null}

                {item.userId && item.userStatus !== "suspended" ? (

                  <AdminDrawerDangerButton

                    onClick={() =>

                      setPending({

                        action: "block",

                        ...COMPLIANCE_CONFIRM.block,

                        variant: "destructive",

                        requireNote: true,

                      })

                    }

                  >

                    {a.actions.block}

                  </AdminDrawerDangerButton>

                ) : null}

                {item.userId && item.userStatus === "suspended" ? (

                  <AdminDrawerSecondaryButton

                    onClick={() =>

                      setPending({

                        action: "unblock",

                        ...COMPLIANCE_CONFIRM.unblock,

                        requireNote: true,

                      })

                    }

                  >

                    Разблокировать

                  </AdminDrawerSecondaryButton>

                ) : null}
                  </>
                }
                right={null}
              />

            </div>

          ) : (

            <AdminFormFooter
              right={
                <AdminDrawerGhostButton onClick={() => guardedOnOpenChange(false)}>
                  Закрыть
                </AdminDrawerGhostButton>
              }
            />

          )

        }

      >

        {loading ? <AdminLoadingState label={a.t("admin.drawer.compliance.loading")} /> : null}

        {item && !loading ? (

          <div className="space-y-5 pb-4">

            <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">

              Risk ID: {item.id}

              <AdminCopyButton value={item.id} />

            </p>

            <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1">

              {tabs.map((t) => (

                <button

                  key={t.id}

                  type="button"

                  className={cn(

                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",

                    tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100",

                  )}

                  onClick={() => setTab(t.id)}

                >

                  {t.label}

                </button>

              ))}

            </div>



            {tab === "overview" ? (

              <dl className="grid gap-3 text-sm sm:grid-cols-2">

                <div>

                  <dt className="text-zinc-500">Rule code</dt>

                  <dd className="font-mono text-xs">{item.flagCode ?? "—"}</dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Статус</dt>

                  <dd>

                    <AdminStatusBadge
                      label={a.formatAdminStatus(item.status)}
                      tone={complianceStatusTone(item.status)}
                    />

                  </dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Severity</dt>

                  <dd>

                    <SeverityBadge severity={item.severity} />

                    <FieldHint text={COMPLIANCE_FIELD_TOOLTIPS.severity} />

                  </dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Risk score</dt>

                  <dd>

                    <AdminRiskBadge score={item.riskScore} />

                    <FieldHint text={COMPLIANCE_FIELD_TOOLTIPS.riskScore} />

                  </dd>

                </div>

                <div>

                  <dt className="text-zinc-500">SLA</dt>

                  <dd>

                    <AdminStatusBadge

                      label={sla?.label ?? "—"}

                      tone={sla?.overdue ? "danger" : "neutral"}

                    />

                    <FieldHint text={COMPLIANCE_FIELD_TOOLTIPS.sla} />

                  </dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Ответственный</dt>

                  <dd>{item.assignedToEmail ?? "Не назначен"}</dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Создан</dt>

                  <dd>{item.createdAt ? formatAdminDate(item.createdAt) : "—"}</dd>

                </div>

                <div>

                  <dt className="text-zinc-500">Обновлён</dt>

                  <dd>{formatAdminDate(item.updatedAt)}</dd>

                </div>

                <div className="sm:col-span-2">

                  <dt className="text-zinc-500">Summary</dt>

                  <dd className="leading-relaxed whitespace-pre-wrap">{item.note || "—"}</dd>

                </div>

              </dl>

            ) : null}



            {tab === "object" ? (

              <div className="space-y-4 text-sm">

                <dl className="grid gap-3 sm:grid-cols-2">

                  <div>

                    <dt className="text-zinc-500">Тип объекта</dt>

                    <dd>{complianceEntityLabel(item.kind)}</dd>

                  </div>

                  <div>

                    <dt className="text-zinc-500">Object ID</dt>

                    <dd className="flex items-center gap-2 font-mono text-xs">

                      {item.reference}

                      <AdminCopyButton value={item.reference} />

                    </dd>

                  </div>

                  {item.userId ? (

                    <div className="sm:col-span-2">

                      <dt className="text-zinc-500">Пользователь</dt>

                      <dd className="flex flex-wrap items-center gap-2">

                        {item.userEmail}

                        <AdminCopyButton value={item.userId} />

                        <Link href={`${ROUTES.adminUsers}/${item.userId}`} className="text-zinc-400 hover:underline">

                          Профиль

                        </Link>

                      </dd>

                    </div>

                  ) : null}

                </dl>

                {obj?.type === "withdrawal" ? (

                  <dl className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-50/80 p-4 sm:grid-cols-2">

                    <div>

                      <dt className="text-zinc-500">Сумма</dt>

                      <dd>{formatUsdtAmount(obj.amountUsdt)}</dd>

                    </div>

                    <div>

                      <dt className="text-zinc-500">Комиссия / net</dt>

                      <dd>

                        {formatUsdtAmount(obj.feeUsdt)} / {formatUsdtAmount(obj.netUsdt)}

                      </dd>

                    </div>

                    <div className="sm:col-span-2">

                      <dt className="text-zinc-500">{a.t("admin.table.trc20")}</dt>

                      <dd className="font-mono text-xs">{obj.trc20Address}</dd>

                    </div>

                    <div>

                      <dt className="text-zinc-500">Статус вывода</dt>

                      <dd>{a.formatAdminStatus(obj.status)}</dd>

                    </div>

                  </dl>

                ) : null}

                {obj?.type === "trade" ? (

                  <dl className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-50/80 p-4 sm:grid-cols-2">

                    <div>

                      <dt className="text-zinc-500">Buyer / Seller</dt>

                      <dd>

                        {obj.buyerEmail} / {obj.sellerEmail}

                      </dd>

                    </div>

                    <div>

                      <dt className="text-zinc-500">Units / price</dt>

                      <dd>

                        {obj.units} · {formatUsdtAmount(obj.priceUsdt)}

                      </dd>

                    </div>

                    <div>

                      <dt className="text-zinc-500">Release</dt>

                      <dd>{obj.releaseTitle}</dd>

                    </div>

                  </dl>

                ) : null}

                {entityPath ? (

                  <Link

                    href={entityPath}

                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 hover:text-zinc-100"

                  >

                    Открыть связанный раздел

                    <ExternalLink className="size-3.5" />

                  </Link>

                ) : null}

              </div>

            ) : null}



            {tab === "evidence" ? (

              item.evidence ? (

                <dl className="space-y-3 text-sm">

                  <div>

                    <dt className="text-zinc-500">Rule</dt>

                    <dd className="font-medium">{item.evidence.ruleTitle}</dd>

                  </div>

                  {item.evidence.threshold ? (

                    <div>

                      <dt className="text-zinc-500">Threshold</dt>

                      <dd>{item.evidence.threshold}</dd>

                    </div>

                  ) : null}

                  <div>

                    <dt className="text-zinc-500">Trigger</dt>

                    <dd>{item.evidence.trigger}</dd>

                  </div>

                  <div>

                    <dt className="text-zinc-500">Calculated values</dt>

                    <dd>

                      <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs">

                        {JSON.stringify(item.evidence.calculatedValues, null, 2)}

                      </pre>

                    </dd>

                  </div>

                </dl>

              ) : (

                <p className="text-sm text-zinc-500">Evidence metadata пока не загружена (TODO backend).</p>

              )

            ) : null}



            {tab === "timeline" ? (

              item.timeline?.length ? (

                <ul className="space-y-3 text-sm">

                  {item.timeline.map((ev, i) => (

                    <li key={i} className="border-l-2 border-zinc-800 pl-3">

                      <p className="font-medium">{a.formatAuditAction(ev.action)}</p>

                      <p className="text-xs text-zinc-500">

                        {ev.actorEmail ?? "system"} · {formatAdminDate(ev.createdAt)}

                      </p>

                    </li>

                  ))}

                </ul>

              ) : (

                <p className="text-sm text-zinc-500">Нет событий timeline.</p>

              )

            ) : null}



            {tab === "notes" ? (

              <div className="space-y-3 text-sm">

                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">{item.note || "Нет заметок."}</p>

                <p className="text-xs text-zinc-500">Internal notes видны только staff. Добавление — через footer drawer.</p>

              </div>

            ) : null}



            {tab === "activity" ? (

              item.relatedActivity ? (

                <div className="grid gap-4 sm:grid-cols-3 text-sm">

                  {(["withdrawals", "trades", "deposits"] as const).map((key) => (

                    <div key={key}>

                      <p className="mb-2 font-semibold capitalize text-zinc-200">{key}</p>

                      <ul className="space-y-2">

                        {item.relatedActivity![key].map((row) => (

                          <li key={row.id} className="rounded-lg border border-zinc-800 px-2 py-1.5 text-xs">

                            <span className="font-mono">{row.id.slice(0, 10)}…</span>

                            <br />

                            {formatUsdtAmount(row.amount)} · {a.formatAdminStatus(row.status)}

                          </li>

                        ))}

                      </ul>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="text-sm text-zinc-500">Related activity не загружена.</p>

              )

            ) : null}



            {tab === "audit" ? (

              item.audit?.length ? (

                <ul className="space-y-2 text-sm">

                  {item.audit.map((entry) => (

                    <li key={entry.id} className="rounded-lg border border-zinc-800 px-3 py-2">

                      <p className="font-mono text-xs">{a.formatAuditAction(entry.action)}</p>

                      <p className="text-xs text-zinc-500">

                        {entry.actorEmail ?? "—"} · {formatAdminDate(entry.createdAt)}

                      </p>

                    </li>

                  ))}

                </ul>

              ) : (

                <p className="text-sm text-zinc-500">

                  Audit записи в{" "}

                  <Link href={ROUTES.adminAudit} className="font-semibold hover:underline">

                    журнале операторов

                  </Link>

                  .

                </p>

              )

            ) : null}

          </div>

        ) : null}

      </AdminDetailDrawer>



      <AdminConfirmDialog

        open={Boolean(pending)}

        onOpenChange={(o) => !o && setPending(null)}

        title={pending?.title ?? ""}

        description={pending?.description ?? ""}

        variant={pending?.variant === "destructive" ? "destructive" : "default"}

        onConfirm={confirmAction}

      />
      {UnsavedChangesDialog}
    </>

  );

}

