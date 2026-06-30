import type { Page } from "@playwright/test";

export const MOCK_PR_SETTINGS = {
  id: "usdt-trc20",
  asset: "USDT",
  network: "TRC20",
  networkDisplayName: "USDT · TRC20",
  tokenContractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  minDepositAmount: "10",
  maxDepositAmount: "50000",
  minConfirmations: 20,
  estimatedCreditTimeMinutes: 1,
  withdrawAvailableAfterMinutes: 2,
  depositEnabled: true,
  withdrawalEnabled: true,
  status: "ACTIVE",
  poolLowThreshold: 5,
  providerMode: "mock",
  providerName: "Mock",
  explorerTxUrlTemplate: null,
  explorerAddressUrlTemplate: null,
  explorerTokenUrlTemplate: null,
  userWarningRu: "Только USDT TRC20",
  userWarningEn: "Send USDT TRC20 only",
  userWarningEs: "Envíe solo USDT TRC20",
  userWarningPt: "Envie apenas USDT TRC20",
  maintenanceMessageRu: null,
  maintenanceMessageEn: null,
  maintenanceMessageEs: null,
  maintenanceMessagePt: null,
  instructionsRu: "Скопируйте адрес и отправьте USDT",
  instructionsEn: "Copy the address and send USDT",
  instructionsEs: "Copie la dirección y envíe USDT",
  instructionsPt: "Copie o endereço e envie USDT",
};

export const MOCK_PR_POOL = {
  items: [
    {
      id: "pool-1",
      address: "TPlaywrightPoolAddress000000001",
      status: "AVAILABLE",
      assignedUserId: null,
      assignedAt: null,
      createdByUserId: null,
      createdAt: new Date().toISOString(),
      disabledAt: null,
      disableReason: null,
    },
  ],
  total: 1,
  availableCount: 1,
  assignedCount: 0,
  disabledCount: 0,
  archivedCount: 0,
  lowThreshold: 5,
  poolLowWarning: false,
};

export const MOCK_PR_PREVIEW = {
  previewMode: true,
  depositEnabled: true,
  asset: "USDT",
  network: "TRC20",
  networkDisplayName: "USDT · TRC20",
  address: "TPREVIEW00000000000000000000000001",
  addressNote: "Preview placeholder",
  qrDataUrl: "data:image/png;base64,iVBORw0KGgo=",
  minDepositAmount: "10",
  maxDepositAmount: "50000",
  userWarnings: ["Send USDT TRC20 only"],
  depositInstructions: "Copy the address and send USDT",
  maintenanceMessage: null,
};

export async function mockPaymentRequisitesApi(page: Page): Promise<void> {
  await page.route("**/api/admin/v1/payment-requisites**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/preview") && method === "GET") {
      const lang = new URL(url).searchParams.get("lang") ?? "ru";
      const warnings =
        lang === "es"
          ? ["Envíe solo USDT TRC20"]
          : lang === "pt"
            ? ["Envie apenas USDT TRC20"]
            : lang === "en"
              ? ["Send USDT TRC20 only"]
              : ["Только USDT TRC20"];
      const instructions =
        lang === "es"
          ? "Copie la dirección y envíe USDT"
          : lang === "pt"
            ? "Copie o endereço e envie USDT"
            : lang === "en"
              ? "Copy the address and send USDT"
              : "Скопируйте адрес и отправьте USDT";
      await route.fulfill({
        json: { ...MOCK_PR_PREVIEW, userWarnings: warnings, depositInstructions: instructions },
      });
      return;
    }

    if (url.includes("/history") && method === "GET") {
      await route.fulfill({
        json: {
          items: [
            {
              id: "hist-1",
              entityType: "deposit_network_settings",
              entityId: "usdt-trc20",
              action: "update",
              before: null,
              after: { minDepositAmount: "10" },
              actorUserId: "playwright-user",
              actorRole: "SUPER_ADMIN",
              reason: "e2e",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
      return;
    }

    if (url.includes("/address-pool") && method === "GET") {
      await route.fulfill({ json: MOCK_PR_POOL });
      return;
    }

    if (url.includes("/address-pool") && method === "POST") {
      const body = route.request().postDataJSON() as { address?: string };
      if (!body.address?.startsWith("T") || body.address.length < 34) {
        await route.fulfill({
          status: 400,
          json: {
            error: { code: "INVALID_TRC20_ADDRESS", message: "Invalid TRC20 address" },
          },
        });
        return;
      }
      await route.fulfill({
        json: {
          id: "pool-new",
          address: body.address,
          status: "AVAILABLE",
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (url.includes("/network-settings") && method === "PATCH") {
      await route.fulfill({ json: { ...MOCK_PR_SETTINGS, ...(route.request().postDataJSON() as object) } });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        json: { settings: MOCK_PR_SETTINGS, pool: MOCK_PR_POOL },
      });
      return;
    }

    await route.continue();
  });
}
