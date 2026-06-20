import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminWithdrawalsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  /** high_value | on_hold | failed | no_tx_hash | pending_queue | with_risk */
  @IsOptional()
  @IsIn(['high_value', 'on_hold', 'failed', 'no_tx_hash', 'pending_queue', 'with_risk'])
  withdrawalFilter?: string;
}
