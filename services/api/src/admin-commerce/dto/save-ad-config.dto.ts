import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SaveAdConfigDto {
  @IsString()
  @MaxLength(32)
  slotCode!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsString()
  @MaxLength(64)
  placement!: string;

  @IsString()
  @MaxLength(32)
  rewardType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  rewardDescription?: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;
}
