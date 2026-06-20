import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminDepositsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  @IsOptional()
  @IsString()
  minConfirmations?: string;

  /** manual_review | high_value | failed | no_tx_hash | with_risk */
  @IsOptional()
  @IsIn(['manual_review', 'high_value', 'failed', 'no_tx_hash', 'with_risk'])
  depositFilter?: string;
}
