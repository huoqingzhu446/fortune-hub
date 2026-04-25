import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitFeedbackDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @IsOptional()
  @IsObject()
  clientInfo?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  attachments?: Array<Record<string, unknown>>;
}
