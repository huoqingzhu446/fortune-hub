import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
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

  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';

  @IsObject()
  payloadJson!: Record<string, unknown>;
}
