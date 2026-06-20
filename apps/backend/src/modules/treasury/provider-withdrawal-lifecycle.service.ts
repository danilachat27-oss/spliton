import { HttpStatus, Injectable } from '@nestjs/common';
import {
  UserRoleCode,
  WithdrawalProviderStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { throwAdminError } from '../admin/common/admin-http.util';

type WithdrawalRow = {
  status: WithdrawalStatus;
  blockchainTxid: string | null;
  providerTxHash: string | null;
  providerStatus: WithdrawalProviderStatus | null;
  manualCompleteOverride: boolean;
};

@Injectable()
export class ProviderWithdrawalLifecycleService {
  private readonly minConfirmations =
    Number(process.env.TRON_CONFIRMATIONS ?? 20) || 20;

  assertCanComplete(
    row: WithdrawalRow,
    options: {
      actorRoles: string[];
      blockchainTxid?: string;
      manualOverride?: boolean;
      manualReason?: string;
    },
  ): void {
    if (options.manualOverride) {
      const ok =
        options.actorRoles.includes(UserRoleCode.SUPER_ADMIN) ||
        options.actorRoles.includes(UserRoleCode.ADMIN);
      if (!ok) {
        throwAdminError(
          'MANUAL_OVERRIDE_FORBIDDEN',
          'Ручное завершение доступно только SUPER_ADMIN / ADMIN',
          HttpStatus.FORBIDDEN,
        );
      }
      if (!options.manualReason?.trim()) {
        throwAdminError(
          'MANUAL_REASON_REQUIRED',
          'Укажите причину ручного завершения вывода',
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }

    const txid = (
      options.blockchainTxid?.trim() ||
      row.blockchainTxid?.trim() ||
      row.providerTxHash?.trim() ||
      ''
    );
    const providerOk =
      row.providerStatus === WithdrawalProviderStatus.CONFIRMED ||
      row.providerStatus === WithdrawalProviderStatus.BROADCASTED;

    if (!txid && !providerOk) {
      throwAdminError(
        'PROVIDER_CONFIRMATION_REQUIRED',
        'Нельзя завершить вывод без tx hash или подтверждения провайдера',
        HttpStatus.CONFLICT,
      );
    }

    if (row.providerStatus === WithdrawalProviderStatus.FAILED) {
      throwAdminError(
        'PROVIDER_FAILED',
        'Провайдер сообщил об ошибке отправки',
        HttpStatus.CONFLICT,
      );
    }
  }

  nextProviderStatusOnQueue(): WithdrawalProviderStatus {
    return WithdrawalProviderStatus.QUEUED_FOR_PROVIDER;
  }

  markConfirmedFields() {
    return {
      providerStatus: WithdrawalProviderStatus.CONFIRMED,
      confirmedAt: new Date(),
      confirmations: this.minConfirmations,
    };
  }
}
