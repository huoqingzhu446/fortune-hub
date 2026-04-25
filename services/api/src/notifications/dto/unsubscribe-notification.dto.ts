import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UnsubscribeNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  scene?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  templateIds?: string[];
}
