import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AdminUpdateStatus,
  AdminUpdateType,
  UserRoleCode,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import {
  assertAdminUpdatesMutate,
  assertAdminUpdatesView,
  audienceMatchesUser,
  canManageAdminUpdates,
} from './admin-updates-permissions';

export type AdminUpdatePublicRow = {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: AdminUpdateType;
  status: AdminUpdateStatus;
  audienceRoles: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  isRead: boolean;
  isDismissed: boolean;
};

export type AdminUpdateActiveResponse = {
  primary: AdminUpdatePublicRow | null;
  remainingCount: number;
  items: AdminUpdatePublicRow[];
};

function isSmokeUpdateTitle(title: string): boolean {
  const t = title.trim();
  return /^\[smoke\]/i.test(t) || /^SMOKE /i.test(t) || /^QA /i.test(t);
}

@Injectable()
export class AdminUpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(
    row: {
      id: string;
      title: string;
      summary: string;
      content: string;
      type: AdminUpdateType;
      status: AdminUpdateStatus;
      audienceRoles: string[];
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    read?: { readAt: Date | null; dismissedAt: Date | null } | null,
  ): AdminUpdatePublicRow {
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      type: row.type,
      status: row.status,
      audienceRoles: row.audienceRoles,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      readAt: read?.readAt?.toISOString() ?? null,
      dismissedAt: read?.dismissedAt?.toISOString() ?? null,
      isRead: Boolean(read?.readAt),
      isDismissed: Boolean(read?.dismissedAt),
    };
  }

  async listActive(
    adminUserId: string,
    roles: UserRoleCode[],
  ): Promise<AdminUpdateActiveResponse> {
    assertAdminUpdatesView(roles);
    const rows = await this.prisma.adminUpdateAnnouncement.findMany({
      where: { status: AdminUpdateStatus.PUBLISHED },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        reads: { where: { adminUserId }, take: 1 },
      },
    });

    const visible = rows
      .filter((r) => audienceMatchesUser(r.audienceRoles, roles))
      .filter((r) => !isSmokeUpdateTitle(r.title))
      .filter((r) => !r.reads[0]?.dismissedAt)
      .map((r) => this.mapRow(r, r.reads[0]));

    return {
      primary: visible[0] ?? null,
      remainingCount: Math.max(0, visible.length - 1),
      items: visible,
    };
  }

  async listHistory(
    adminUserId: string,
    roles: UserRoleCode[],
    filters?: { type?: AdminUpdateType },
  ): Promise<AdminUpdatePublicRow[]> {
    assertAdminUpdatesView(roles);
    const rows = await this.prisma.adminUpdateAnnouncement.findMany({
      where: {
        status: { in: [AdminUpdateStatus.PUBLISHED, AdminUpdateStatus.ARCHIVED] },
        ...(filters?.type ? { type: filters.type } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        reads: { where: { adminUserId }, take: 1 },
      },
    });

    return rows
      .filter((r) => audienceMatchesUser(r.audienceRoles, roles))
      .filter((r) => !isSmokeUpdateTitle(r.title))
      .map((r) => this.mapRow(r, r.reads[0]));
  }

  async listManage(roles: UserRoleCode[]) {
    assertAdminUpdatesView(roles);
    const rows = await this.prisma.adminUpdateAnnouncement.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
      },
    });
    if (canManageAny(roles)) return rows;
    return rows.filter(
      (r) =>
        r.type === AdminUpdateType.LEGAL &&
        roles.includes(UserRoleCode.COMPLIANCE),
    );
  }

  private canManageRow(roles: UserRoleCode[], type: AdminUpdateType): boolean {
    return canManageAdminUpdates(roles, type);
  }

  async getById(id: string, roles: UserRoleCode[]) {
    assertAdminUpdatesView(roles);
    const row = await this.prisma.adminUpdateAnnouncement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
      },
    });
    if (!row) {
      throwAdminError('NOT_FOUND', 'Update not found', HttpStatus.NOT_FOUND);
    }
    if (
      row.status === AdminUpdateStatus.DRAFT &&
      !this.canManageRow(roles, row.type)
    ) {
      throwAdminError('FORBIDDEN', 'Draft not accessible', HttpStatus.FORBIDDEN);
    }
    return row;
  }

  async create(
    roles: UserRoleCode[],
    adminUserId: string,
    data: {
      title: string;
      summary: string;
      content: string;
      type: AdminUpdateType;
      audienceRoles: string[];
    },
  ) {
    assertAdminUpdatesMutate(roles, data.type);
    return this.prisma.adminUpdateAnnouncement.create({
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        type: data.type,
        audienceRoles: data.audienceRoles,
        status: AdminUpdateStatus.DRAFT,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
      },
    });
  }

  async update(
    id: string,
    roles: UserRoleCode[],
    adminUserId: string,
    data: Partial<{
      title: string;
      summary: string;
      content: string;
      type: AdminUpdateType;
      audienceRoles: string[];
    }>,
  ) {
    const row = await this.getById(id, roles);
    assertAdminUpdatesMutate(roles, data.type ?? row.type);
    if (row.status === AdminUpdateStatus.ARCHIVED) {
      throwAdminError(
        'INVALID_STATUS',
        'Archived updates cannot be edited',
        HttpStatus.CONFLICT,
      );
    }
    if (row.status === AdminUpdateStatus.PUBLISHED) {
      throwAdminError(
        'IMMUTABLE',
        'Published updates cannot be edited directly',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.adminUpdateAnnouncement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.audienceRoles !== undefined
          ? { audienceRoles: data.audienceRoles }
          : {}),
        updatedByAdminId: adminUserId,
      },
    });
  }

  async publish(id: string, roles: UserRoleCode[], adminUserId: string) {
    const row = await this.getById(id, roles);
    assertAdminUpdatesMutate(roles, row.type);
    if (row.status !== AdminUpdateStatus.DRAFT) {
      throwAdminError(
        'INVALID_STATUS',
        'Only draft updates can be published',
        HttpStatus.CONFLICT,
      );
    }
    const now = new Date();
    return this.prisma.adminUpdateAnnouncement.update({
      where: { id },
      data: {
        status: AdminUpdateStatus.PUBLISHED,
        publishedAt: now,
        updatedByAdminId: adminUserId,
      },
    });
  }

  async archive(id: string, roles: UserRoleCode[], adminUserId: string) {
    const row = await this.getById(id, roles);
    assertAdminUpdatesMutate(roles, row.type);
    if (row.status === AdminUpdateStatus.ARCHIVED) return row;
    return this.prisma.adminUpdateAnnouncement.update({
      where: { id },
      data: {
        status: AdminUpdateStatus.ARCHIVED,
        updatedByAdminId: adminUserId,
      },
    });
  }

  async markRead(adminUserId: string, roles: UserRoleCode[], id: string) {
    assertAdminUpdatesView(roles);
    await this.assertVisiblePublished(id, roles);
    const now = new Date();
    return this.prisma.adminUpdateRead.upsert({
      where: {
        announcementId_adminUserId: {
          announcementId: id,
          adminUserId,
        },
      },
      create: {
        announcementId: id,
        adminUserId,
        readAt: now,
      },
      update: {
        readAt: now,
      },
    });
  }

  async dismiss(adminUserId: string, roles: UserRoleCode[], id: string) {
    assertAdminUpdatesView(roles);
    await this.assertVisiblePublished(id, roles);
    const now = new Date();
    return this.prisma.adminUpdateRead.upsert({
      where: {
        announcementId_adminUserId: {
          announcementId: id,
          adminUserId,
        },
      },
      create: {
        announcementId: id,
        adminUserId,
        readAt: now,
        dismissedAt: now,
      },
      update: {
        readAt: now,
        dismissedAt: now,
      },
    });
  }

  async seedLegalCmsUpdateIfMissing(): Promise<'created' | 'skipped'> {
    const title = 'Обновлён раздел юридических документов';
    const existing = await this.prisma.adminUpdateAnnouncement.findFirst({
      where: { title, type: AdminUpdateType.LEGAL },
    });
    if (existing) return 'skipped';

    const content = `Мы обновили Legal CMS в Spliton.

Что изменилось:
- добавлено управление юридическими документами через админку;
- появились версии документов и история изменений;
- опубликованы обязательные документы Terms, Privacy, AML, Risk Disclosure и другие;
- согласия пользователей теперь привязаны к конкретной версии документа;
- добавлен content hash для доказуемости принятого текста;
- financial actions теперь требуют актуальные согласия;
- старые черновики были архивированы без удаления.

Статус: READY WITH P1 FIXES.
Осталось: юридическая вычитка текстов и ручная проверка browser admin UI.`;

    const now = new Date();
    await this.prisma.adminUpdateAnnouncement.create({
      data: {
        title,
        summary:
          'В админке появился обновлённый модуль управления юридическими документами, версиями политик и согласием пользователей.',
        content,
        type: AdminUpdateType.LEGAL,
        status: AdminUpdateStatus.PUBLISHED,
        audienceRoles: [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.COMPLIANCE,
          UserRoleCode.BUSINESS_ANALYST,
          UserRoleCode.CONTENT_MANAGER,
          UserRoleCode.SUPPORT_MANAGER,
        ],
        publishedAt: now,
      },
    });
    return 'created';
  }

  async seedPublicEnLocalizationUpdateIfMissing(): Promise<'created' | 'skipped'> {
    const title = 'Обновлены языки публичной версии Spliton';
    const existing = await this.prisma.adminUpdateAnnouncement.findFirst({
      where: { title, type: AdminUpdateType.UX },
    });
    if (existing) return 'skipped';

    const content = `Мы завершили основной этап EN-локализации публичной части Spliton.

Что изменилось:
- публичная EN-версия больше не показывает кириллицу в user-facing runtime;
- убран fallback EN → RU в i18n lookup и API error mapping;
- каталог, buy flow, вторичный рынок, wallet/assets, profile и support переведены на i18n-ключи;
- backend status/risk labels больше не выводятся напрямую в EN UI;
- mock/demo данные локализуются перед отображением;
- добавлены unit-тесты и smoke-проверка на отсутствие кириллицы в EN.

Статус: PUBLIC EN READY.
Отдельно: Admin EN остаётся в backlog (admin-messages, treasury, legal drawer) — не блокирует публичный релиз.

Проверка: переключите locale на EN в публичном кабинете или откройте ключевые маршруты с cookie spliton_locale=en.`;

    const now = new Date();
    await this.prisma.adminUpdateAnnouncement.create({
      data: {
        title,
        summary:
          'Публичная английская версия готова к production: без русских протечек в UI, с безопасным EN fallback и покрытием основных пользовательских маршрутов.',
        content,
        type: AdminUpdateType.UX,
        status: AdminUpdateStatus.PUBLISHED,
        audienceRoles: [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.COMPLIANCE,
          UserRoleCode.BUSINESS_ANALYST,
          UserRoleCode.CONTENT_MANAGER,
          UserRoleCode.SUPPORT_MANAGER,
          UserRoleCode.NEWS_MANAGER,
        ],
        publishedAt: now,
      },
    });
    return 'created';
  }

  async seedCalculatorUnitsUpdateIfMissing(): Promise<'created' | 'skipped'> {
    const title = 'Обновлён калькулятор покупки и сделок UNT';
    const existing = await this.prisma.adminUpdateAnnouncement.findFirst({
      where: { title, type: AdminUpdateType.FEATURE },
    });
    if (existing) return 'skipped';

    const content = `Мы выкатили исправление калькулятора units и money-flow в Spliton.

Что изменилось для пользователей:
- покупка UNT считается по цене конкретного релиза/листинга, без фиксированного курса 1 UNT = 1 USDT;
- сумма к оплате = units × pricePerUnit; комиссия показывается информационно и удерживается из gross;
- при бюджете меньше цены одного UNT покупка блокируется (раньше ошибочно показывался 1 UNT);
- учитываются minPurchaseUnits / maxPurchaseUnits с backend preview;
- invalid price / NaN / Infinity блокируют submit и не показывают NaN в UI;
- standalone калькулятор (/assets/calculator) приведён к той же модели, что checkout в каталоге;
- secondary buy demo: buyerTotal = gross (fee не добавляется сверху).

Что проверить оператору:
- /catalog/buy/[id] — sidebar и panel показывают одну цену и availableUnits;
- /assets/calculator — footnote «иллюстрация» и совпадение units с buy page при тех же вводах;
- sell / create listing / order book demo — fallback fee 2% primary / 1% secondary, если API недоступен;
- live preview и submit по-прежнему authoritative на backend.

Статус: CALCULATOR UNITS CLOSEOUT — production ready.
Backend API / DTO / БД не менялись в рамках этого релиза.`;

    const now = new Date();
    await this.prisma.adminUpdateAnnouncement.create({
      data: {
        title,
        summary:
          'Исправлен расчёт UNT при покупке: единая модель gross, лимиты раунда, SSR/client sync и согласованные demo fee 2%/1%.',
        content,
        type: AdminUpdateType.FEATURE,
        status: AdminUpdateStatus.PUBLISHED,
        audienceRoles: [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.COMPLIANCE,
          UserRoleCode.BUSINESS_ANALYST,
          UserRoleCode.CONTENT_MANAGER,
          UserRoleCode.SUPPORT_MANAGER,
          UserRoleCode.NEWS_MANAGER,
          UserRoleCode.ACCOUNTANT,
        ],
        publishedAt: now,
      },
    });
    return 'created';
  }

  async seedPaymentRequisitesUpdateIfMissing(): Promise<'created' | 'skipped'> {
    const title = 'Новый модуль управления реквизитами пополнения';
    const existing = await this.prisma.adminUpdateAnnouncement.findFirst({
      where: { title, type: AdminUpdateType.FEATURE },
    });
    if (existing) return 'skipped';

    const content = `В админке добавлен новый раздел управления реквизитами пополнения: \`/admin/payment-requisites\`.

Что появилось:
- управление настройками сети USDT TRC20;
- включение/выключение депозитов;
- настройка contract address, min/max amount, confirmations;
- редактирование предупреждений и инструкций на RU/EN/ES/PT;
- управление пулом deposit-адресов;
- bulk add адресов;
- disable/enable/archive адресов;
- preview пользовательской страницы пополнения;
- history/audit изменений;
- read-only доступ для support/compliance/admin ролей;
- защита от невалидных TRC20-адресов;
- корректные состояния для пользователя: deposits disabled / address unavailable.

Важно:
Адрес пополнения в Spliton остаётся персональным для пользователя и назначается из address pool. Это не один общий wallet платформы.

Перед production:
- применить миграцию на staging/prod;
- проверить address pool;
- пройти staging QA checklist;
- прогнать frontend/backend e2e в CI/dedicated test DB.

---

EN — New Payment Requisites Management Module

A new payment requisites management section has been added to the admin panel: \`/admin/payment-requisites\`.

Included:
- USDT TRC20 network settings management;
- deposit enable/disable control;
- contract address, min/max amount and confirmations settings;
- RU/EN/ES/PT warnings and instructions;
- deposit address pool management;
- bulk address import;
- disable/enable/archive address actions;
- user-facing deposit page preview;
- change history and audit trail;
- read-only access for support/compliance/admin roles;
- TRC20 address validation;
- user-safe states for deposits disabled / address unavailable.

Important:
Spliton still uses personal deposit addresses assigned from the address pool. This is not a single shared platform wallet.

Before production:
- apply migration on staging/prod;
- verify address pool;
- complete staging QA checklist;
- run frontend/backend e2e in CI/dedicated test DB.`;

    const now = new Date();
    await this.prisma.adminUpdateAnnouncement.create({
      data: {
        title,
        summary:
          'Payment Requisites & Deposit Flow: новый раздел `/admin/payment-requisites`, user deposit через `/api/v1/wallet/deposit-info`, RU/EN/ES/PT, pool, preview, audit.',
        content,
        type: AdminUpdateType.FEATURE,
        status: AdminUpdateStatus.PUBLISHED,
        audienceRoles: [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.ACCOUNTANT,
          UserRoleCode.COMPLIANCE,
          UserRoleCode.BUSINESS_ANALYST,
          UserRoleCode.SUPPORT_MANAGER,
          UserRoleCode.SUPPORT,
        ],
        publishedAt: now,
      },
    });
    return 'created';
  }

  private async assertVisiblePublished(id: string, roles: UserRoleCode[]) {
    const row = await this.prisma.adminUpdateAnnouncement.findUnique({
      where: { id },
    });
    if (!row || row.status !== AdminUpdateStatus.PUBLISHED) {
      throwAdminError('NOT_FOUND', 'Update not found', HttpStatus.NOT_FOUND);
    }
    if (!audienceMatchesUser(row.audienceRoles, roles)) {
      throwAdminError('FORBIDDEN', 'Update not visible', HttpStatus.FORBIDDEN);
    }
  }
}

function canManageAny(roles: UserRoleCode[]): boolean {
  return roles.some(
    (r) => r === UserRoleCode.SUPER_ADMIN || r === UserRoleCode.ADMIN,
  );
}
