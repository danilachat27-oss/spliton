# KYC / AML foundation (Spliton)

> Перед real money: интеграция внешнего KYC-провайдера и финальные AML-правила — **решение compliance + юристов**.

## KYC

- Модель `KycVerification`: статусы `NOT_STARTED` … `MANUAL_REVIEW_REQUIRED`, уровни `KycLevel`.
- User API: `GET/POST /api/v1/kyc/status`, `start`, `submit-manual`.
- Admin: reviews approve/reject — `admin-kyc.controller.ts`.
- Env: `COMPLIANCE_KYC_REQUIRED_FOR_WITHDRAWAL`, `COMPLIANCE_KYC_REQUIRED_FOR_TRADING`.

## AML

- `UserAmlProfile`: `riskLevel` (LOW/MEDIUM/HIGH/BLOCKED), `restrictions` JSON.
- `ComplianceRiskScoringService` — эвристики (объём выводов, rapid flow, country, KYC).
- Ограничения: `restrictWithdrawals`, `restrictSecondaryTrading`, `freezeAccount` — проверяет `EligibilityService`.

## Audit

KYC approve/reject и legal policy publish — через `AdminAuditService`.
Принятие согласий пользователем — `LegalAuditService` (`USER_CONSENT_ACCEPTED` в `auditLog`).
