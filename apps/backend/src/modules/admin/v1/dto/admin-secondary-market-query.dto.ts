import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminSecondaryMarketQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  @IsOptional()
  @IsString()
  minUnits?: string;

  @IsOptional()
  @IsString()
  maxUnits?: string;

  /** active | frozen | cancelled | suspicious | high_value */
  @IsOptional()
  @IsIn([
    'active',
    'frozen',
    'cancelled',
    'frozen_cancelled',
    'suspicious',
    'high_value',
    'all',
  ])
  marketFilter?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;
}
