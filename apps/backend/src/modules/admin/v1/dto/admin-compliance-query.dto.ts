import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminComplianceQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  minRiskScore?: string;

  @IsOptional()
  @IsString()
  maxRiskScore?: string;

  @IsOptional()
  @IsIn([
    'queue',
    'critical',
    'high',
    'overdue',
    'unassigned',
    'frozen',
    'blocked',
  ])
  queueFilter?: string;
}
