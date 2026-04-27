import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePosterDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  recordId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['lucky_sign', 'today_index', 'zodiac_today'])
  sourceType?: 'lucky_sign' | 'today_index' | 'zodiac_today';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bizCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['1280x1280', '1080x1440', '1088x1472'])
  size?: '1280x1280' | '1080x1440' | '1088x1472';
}
