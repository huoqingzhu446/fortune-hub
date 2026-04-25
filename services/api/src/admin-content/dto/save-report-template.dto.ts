import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class SaveReportTemplateDto {
  @IsString()
  @MaxLength(64)
  templateType!: string;

  @IsString()
  @MaxLength(64)
  bizCode!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  engine?: string;

  @IsInt()
  @Min(1)
  sortOrder!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  grayPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  releaseNote?: string;

  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';

  @IsObject()
  payloadJson!: Record<string, unknown>;
}
