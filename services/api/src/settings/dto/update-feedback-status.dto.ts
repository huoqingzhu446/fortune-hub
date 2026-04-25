import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFeedbackStatusDto {
  @IsString()
  @IsIn(['open', 'processing', 'resolved', 'closed'])
  status!: 'open' | 'processing' | 'resolved' | 'closed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
