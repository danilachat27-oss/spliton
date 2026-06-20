import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** Matches frontend `AdminUserListItem` for mock/live parity */
export type AdminUserListItemDto = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  status: string;
  availableBalanceUsdt: string;
  lockedBalanceUsdt: string;
  totalHoldingsUnits: string;
  createdAt: string;
  lastActivityAt: string;
};

export type AdminUserDetailDto = AdminUserListItemDto & {
  phone: string | null;
  kycStatus: string | null;
};

export class PatchUserStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignUserRoleDto {
  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  confirmSuperAdmin?: boolean;
}

export class AdminNoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteWithdrawalDto extends AdminNoteDto {
  @IsOptional()
  @IsString()
  blockchainTxid?: string;

  /** SUPER_ADMIN manual override — requires manualCompleteReason. */
  @IsOptional()
  @IsBoolean()
  manualOverride?: boolean;

  @IsOptional()
  @IsString()
  manualCompleteReason?: string;
}

export class RejectWithdrawalDto extends AdminNoteDto {
  @IsString()
  rejectionReason!: string;
}
