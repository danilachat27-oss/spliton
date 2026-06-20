import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminWalletsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  network?: string;

  /** active | blocked | staff | risk */
  @IsOptional()
  @IsIn(['active', 'blocked', 'staff', 'risk'])
  userStatus?: string;

  /** locked | pending_withdrawal | pending_deposit | risk | recent_activity */
  @IsOptional()
  @IsIn([
    'locked',
    'pending_withdrawal',
    'pending_deposit',
    'risk',
    'recent_activity',
  ])
  walletFilter?: string;

  @IsOptional()
  @IsString()
  minAvailable?: string;

  @IsOptional()
  @IsString()
  maxAvailable?: string;

  @IsOptional()
  @IsString()
  minLocked?: string;

  @IsOptional()
  @IsString()
  maxLocked?: string;
}
