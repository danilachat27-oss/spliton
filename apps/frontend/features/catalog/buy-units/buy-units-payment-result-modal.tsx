"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, Download, XCircle } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export type BuyUnitsPaymentReceipt = {
  releaseTitle: string;
  artist: string;
  symbol: string;
  releaseId: string;
  units: number;
  unitPriceUsdt: number;
  totalUsdt: number;
  paidAtIso: string;
  transactionId: string;
  status: "approved" | "declined";
  orderId?: string;
  useServerReceipt?: boolean;
};

type BuyUnitsPaymentResultModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: BuyUnitsPaymentReceipt | null;
  onDownloadServerReceipt?: (orderId: string) => Promise<void>;
};

function formatMoney(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU");
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 py-2.5 text-[12px] last:border-b-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="min-w-0 text-right font-mono tabular-nums text-zinc-900">{value}</span>
    </div>
  );
}

async function downloadReceiptPdf(receipt: BuyUnitsPaymentReceipt) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const statusLabel = receipt.status === "approved" ? "Approved" : "Declined";
  const stampDate = new Date(receipt.paidAtIso).toLocaleString("en-GB", { hour12: false });
  const valueColumnX = margin + contentWidth - 4;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(245, 245, 246);
  doc.roundedRect(margin, margin, contentWidth, 90, 12, 12, "F");

  doc.setFillColor(18, 18, 20);
  doc.roundedRect(margin + 16, margin + 16, 52, 24, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("NS5", margin + 42, margin + 34, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(24, 24, 27);
  doc.text("Spliton purchase receipt", margin + 80, margin + 34);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(82, 82, 91);
  doc.text(`Receipt ID: ${receipt.transactionId}`, margin + 80, margin + 52);
  doc.text(`Date: ${stampDate}`, margin + 80, margin + 68);

  const badgeWidth = 88;
  const badgeX = margin + contentWidth - badgeWidth - 16;
  const badgeY = margin + 28;
  if (receipt.status === "approved") {
    doc.setFillColor(22, 163, 74);
  } else {
    doc.setFillColor(225, 29, 72);
  }
  doc.roundedRect(badgeX, badgeY, badgeWidth, 24, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel.toUpperCase(), badgeX + badgeWidth / 2, badgeY + 16, { align: "center" });

  const sectionTop = margin + 106;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, sectionTop, contentWidth, 124, 10, 10, "F");

  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Transaction details", margin + 16, sectionTop + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Status: ${statusLabel}`, margin + 16, sectionTop + 46);
  doc.text(`Settlement: in-platform`, margin + 16, sectionTop + 64);
  doc.text(`Pricing: per release`, margin + 16, sectionTop + 82);
  doc.text(`Release ID: ${receipt.releaseId}`, margin + 16, sectionTop + 100);

  doc.text(`Release: ${receipt.releaseTitle}`, margin + contentWidth / 2 - 8, sectionTop + 46);
  doc.text(`Artist: ${receipt.artist}`, margin + contentWidth / 2 - 8, sectionTop + 64);
  doc.text(`Symbol: ${receipt.symbol}`, margin + contentWidth / 2 - 8, sectionTop + 82);
    doc.text(`UNT bought: ${receipt.units}`, margin + contentWidth / 2 - 8, sectionTop + 100);

  const tableTop = sectionTop + 146;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Payment breakdown", margin, tableTop);

  const tY = tableTop + 14;

  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  doc.text("Description", margin + 4, tY + 18);
  doc.text("Value", valueColumnX, tY + 18, { align: "right" });

  const rows: Array<[string, string]> = [
    ["Unit price", formatMoney(receipt.unitPriceUsdt)],
    ["Quantity", `${receipt.units} UNT`],
    ["Subtotal", formatMoney(receipt.totalUsdt)],
    ["Platform fee", "0.00"],
  ];

  let rowY = tY + 42;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(39, 39, 42);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 4, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(value, valueColumnX, rowY, { align: "right" });
    rowY += 22;
  }

  const totalBoxY = rowY + 8;
  doc.setFillColor(245, 245, 246);
  doc.roundedRect(margin, totalBoxY, contentWidth, 44, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text("TOTAL", margin + 12, totalBoxY + 27);
  doc.text(formatMoney(receipt.totalUsdt), valueColumnX - 8, totalBoxY + 27, {
    align: "right",
  });

  doc.setTextColor(113, 113, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    "This receipt confirms processing status for a revenue share UNT purchase on Spliton.",
    margin,
    pageHeight - 34,
  );

  doc.save(`spliton-receipt-${receipt.releaseId}-${receipt.transactionId}.pdf`);
}

export function BuyUnitsPaymentResultModal({
  open,
  onOpenChange,
  receipt,
  onDownloadServerReceipt,
}: BuyUnitsPaymentResultModalProps) {
  const { t } = useI18n();
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  if (!receipt) return null;

  const isApproved = receipt.status === "approved";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-120 bg-black/60 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-121 w-[min(100vw-1.5rem,560px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-black/5 md:p-6",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <div className="flex items-start gap-3">
            {isApproved ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
            )}
            <div className="min-w-0">
              <Dialog.Title className="text-[18px] font-semibold tracking-tight text-zinc-950">
                {isApproved ? t("catalog.buy.receipt.approvedTitle") : t("catalog.buy.receipt.declinedTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-relaxed text-zinc-600">
                {isApproved
                  ? t("catalog.buy.receipt.approvedBody")
                  : t("catalog.buy.receipt.declinedBody")}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3.5">
            <SummaryRow label={t("catalog.buy.receipt.release")} value={`${receipt.releaseTitle} · ${receipt.symbol}`} />
            <SummaryRow label={t("catalog.buy.receipt.artist")} value={receipt.artist} />
            <SummaryRow label={t("catalog.buy.receipt.releaseId")} value={receipt.releaseId} />
            <SummaryRow label={t("catalog.buy.receipt.units")} value={receipt.units} />
            <SummaryRow label={t("catalog.buy.receipt.unitPrice")} value={formatMoney(receipt.unitPriceUsdt)} />
            <SummaryRow label={t("catalog.buy.receipt.total")} value={formatMoney(receipt.totalUsdt)} />
            <SummaryRow
              label={t("catalog.buy.receipt.status")}
              value={isApproved ? t("catalog.buy.receipt.statusApproved") : t("catalog.buy.receipt.statusDeclined")}
            />
            <SummaryRow label={t("catalog.buy.receipt.date")} value={formatDate(receipt.paidAtIso)} />
            <SummaryRow label="Transaction ID" value={receipt.transactionId} />
          </div>

          {downloadError ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">{downloadError}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {isApproved ? (
              <Link
                href={ROUTES.dashboardPositions}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
              >
                {t("catalog.buy.receipt.toPosition")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                setDownloadError(null);
                if (receipt.useServerReceipt && receipt.orderId && onDownloadServerReceipt) {
                  try {
                    await onDownloadServerReceipt(receipt.orderId);
                  } catch (e) {
                    setDownloadError(t("catalog.buy.receipt.downloadFailed"));
                  }
                  return;
                }
                try {
                  await downloadReceiptPdf(receipt);
                } catch {
                  setDownloadError(t("catalog.buy.receipt.downloadFailed"));
                }
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <Download className="size-4" />
              {t("catalog.buy.receipt.downloadPdf")}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              {t("catalog.buy.receipt.close")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
