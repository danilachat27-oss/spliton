import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateDepositNetworkSettingsDto {
  @IsOptional()
  @IsString()
  reason?: string;

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
  @IsBoolean()
  depositEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  withdrawalEnabled?: boolean;

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
  userWarningKa?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageRu?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageEn?: string;

  @IsOptional()
  @IsString()
  maintenanceMessageKa?: string;
}
