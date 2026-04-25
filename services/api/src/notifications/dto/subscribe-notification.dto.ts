import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubscribeNotificationDto {
  @IsString()
  @MaxLength(32)
  scene!: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  templateIds!: string[];

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}
