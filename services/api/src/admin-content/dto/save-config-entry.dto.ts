import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SaveConfigEntryDto {
  @IsString()
  @MaxLength(64)
  namespace!: string;

  @IsString()
  @MaxLength(128)
  configKey!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json'])
  valueType?: 'string' | 'number' | 'boolean' | 'json';

  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';

  @IsObject()
  valueJson!: Record<string, unknown>;
}
