import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminRevenueQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  /** pending | failed | completed | manual_review */
  @IsOptional()
  @IsIn(['pending', 'failed', 'completed', 'manual_review', 'high_value'])
  revenueFilter?: string;
}
