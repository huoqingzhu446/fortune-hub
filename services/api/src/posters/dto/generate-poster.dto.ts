import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePosterDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  recordId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['lucky_sign'])
  sourceType?: 'lucky_sign';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bizCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['1280x1280'])
  size?: '1280x1280';
}
