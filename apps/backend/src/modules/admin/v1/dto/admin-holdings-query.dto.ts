import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from '../../common/dto/admin-list-query.dto';

export class AdminHoldingsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  minUnits?: string;

  @IsOptional()
  @IsString()
  maxUnits?: string;

  @IsOptional()
  @IsString()
  minValue?: string;

  @IsOptional()
  @IsString()
  maxValue?: string;

  /** locked | listing | earned | risk */
  @IsOptional()
  @IsIn(['locked', 'listing', 'earned', 'risk'])
  holdingFilter?: string;

  @IsOptional()
  @IsString()
  releaseStatus?: string;
}
