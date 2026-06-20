import { describe, expect, it } from "vitest";

import { mapKycStatusToUi } from "@/lib/kyc/kyc-status-adapter";

describe("mapKycStatusToUi", () => {
  it("maps backend statuses to UI states", () => {
    expect(mapKycStatusToUi("NOT_STARTED")).toBe("not_started");
    expect(mapKycStatusToUi("PENDING")).toBe("in_progress");
    expect(mapKycStatusToUi("IN_REVIEW")).toBe("pending_review");
    expect(mapKycStatusToUi("MANUAL_REVIEW_REQUIRED")).toBe("pending_review");
    expect(mapKycStatusToUi("APPROVED")).toBe("approved");
    expect(mapKycStatusToUi("REJECTED")).toBe("rejected");
    expect(mapKycStatusToUi("EXPIRED")).toBe("rejected");
  });
});
