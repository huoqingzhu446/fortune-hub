import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ToggleFavoriteDto {
  @IsString()
  @MaxLength(32)
  itemType!: string;

  @IsString()
  @MaxLength(128)
  itemKey!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;

  @IsString()
  @MaxLength(255)
  route!: string;

  @IsOptional()
  @IsObject()
  extraJson?: Record<string, unknown>;
}
