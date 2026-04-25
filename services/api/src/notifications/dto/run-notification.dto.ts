import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RunNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  scene?: string;

  @IsOptional()
  @IsString()
  @IsIn(['queue', 'send'])
  mode?: 'queue' | 'send';
}
