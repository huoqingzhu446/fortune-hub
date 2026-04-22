import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class OrderPayCallbackDto {
  @IsOptional()
  @IsString()
  @IsIn(['paid', 'failed'])
  status?: 'paid' | 'failed';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  transactionNo?: string;
}
