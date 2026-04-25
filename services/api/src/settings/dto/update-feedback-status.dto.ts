import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFeedbackStatusDto {
  @IsString()
  @IsIn(['open', 'processing', 'resolved', 'closed'])
  status!: 'open' | 'processing' | 'resolved' | 'closed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminReply?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  assignee?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}
