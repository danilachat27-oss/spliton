import type { VerificationUiStatus } from "@/constants/dashboard/profile-verification";

export type KycStatusApi =
  | "NOT_STARTED"
  | "PENDING"
  | "IN_REVIEW"
  | "MANUAL_REVIEW_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type KycStatusResponse = {
  status: KycStatusApi;
  level: string;
  countryCode: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  rejectionReasonSafe: string | null;
  provider: string;
};

export function mapKycStatusToUi(status: KycStatusApi | string): VerificationUiStatus {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
    case "EXPIRED":
      return "rejected";
    case "IN_REVIEW":
    case "MANUAL_REVIEW_REQUIRED":
      return "pending_review";
    case "PENDING":
      return "in_progress";
    case "NOT_STARTED":
    default:
      return "not_started";
  }
}
