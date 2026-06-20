import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminPlatformRevenueQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsString()
  feeUserId?: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  subjectType?: string;
}
