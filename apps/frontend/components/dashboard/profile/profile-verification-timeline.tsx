"use client";

import { Check } from "@/lib/lucide";

import type { VerificationUiStatus } from "@/constants/dashboard/profile-verification";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type TimelineStepId = "not_started" | "started" | "submitted" | "manual_review" | "decision";

const STEPS: TimelineStepId[] = [
  "not_started",
  "started",
  "submitted",
  "manual_review",
  "decision",
];

function stepState(
  status: VerificationUiStatus,
  step: TimelineStepId,
): "done" | "current" | "upcoming" {
  const order: Record<TimelineStepId, number> = {
    not_started: 0,
    started: 1,
    submitted: 2,
    manual_review: 3,
    decision: 4,
  };

  let current: TimelineStepId = "not_started";
  if (status === "in_progress") current = "started";
  else if (status === "pending_review") current = "manual_review";
  else if (status === "approved" || status === "rejected") current = "decision";

  const stepIdx = order[step];
  const currentIdx = order[current];
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function ProfileVerificationTimeline({ status }: { status: VerificationUiStatus }) {
  const { t } = useI18n();

  return (
    <ol className="mt-4 space-y-0">
      {STEPS.map((step, index) => {
        const visual = stepState(status, step);
        const isLast = index === STEPS.length - 1;
        const labelKey =
          step === "decision"
            ? status === "rejected"
              ? "verification.timeline.decisionRejected"
              : status === "approved"
                ? "verification.timeline.decisionApproved"
                : "verification.timeline.decision"
            : `verification.timeline.${step}`;

        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px",
                  visual === "done" ? "bg-lime-300/90" : "bg-neutral-200",
                )}
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                "relative z-1 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                visual === "done" && "bg-lime-400 text-neutral-950",
                visual === "current" && "bg-neutral-900 text-white",
                visual === "upcoming" && "bg-neutral-100 text-neutral-400",
              )}
            >
              {visual === "done" ? <Check className="size-4" aria-hidden /> : index + 1}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-neutral-900">{t(labelKey)}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{t(`${labelKey}Hint`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
