import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitDataDeletionRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsObject()
  clientInfo?: Record<string, unknown>;
}
