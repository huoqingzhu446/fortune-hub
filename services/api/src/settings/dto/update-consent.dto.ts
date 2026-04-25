import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConsentDto {
  @IsString()
  @MaxLength(32)
  consentType!: string;

  @IsString()
  @MaxLength(32)
  version!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @IsOptional()
  @IsObject()
  clientInfo?: Record<string, unknown>;
}
