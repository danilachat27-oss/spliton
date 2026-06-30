import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DepositNetworkSettingsStatus } from '@prisma/client';

export class UpdateDepositNetworkSettingsDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  networkDisplayName?: string;

  @IsOptional()
  @IsString()
  tokenContractAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokenDecimals?: number;

  @IsOptional()
  @IsString()
  minDepositAmount?: string;

  @IsOptional()
  @IsString()
  maxDepositAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minConfirmations?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCreditTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  withdrawAvailableAfterMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  poolLowThreshold?: number;

  @IsOptional()
  @IsBoolean()
  depositEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  withdrawalEnabled?: boolean;

  @IsOptional()
  @IsEnum(DepositNetworkSettingsStatus)
  status?: DepositNetworkSettingsStatus;

  @IsOptional()
  @IsString()
  providerMode?: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsString()
  explorerTxUrlTemplate?: string;

  @IsOptional()
  @IsString()
  explorerAddressUrlTemplate?: string;

  @IsOptional()
  @IsString()
  explorerTokenUrlTemplate?: string;

  @IsOptional()
  @IsString()
  userWarningRu?: string;

  @IsOptional()
  @IsString()
  userWarningEn?: string;

  @IsOptional()
  @IsString()
  userWarningEs?: string;

  @IsOptional()
  @IsString()
  userWarningPt?: string;

  @IsOptional()
  @IsString()
  userWarningKa?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageRu?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageEn?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageEs?: string;

  @IsOptional()
  @IsString()
  maintenanceMessagePt?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageKa?: string;

  @IsOptional()
  @IsString()
  instructionsRu?: string;

  @IsOptional()
  @IsString()
  instructionsEn?: string;

  @IsOptional()
  @IsString()
  instructionsEs?: string;

  @IsOptional()
  @IsString()
  instructionsPt?: string;
}
