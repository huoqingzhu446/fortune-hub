import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class GenerateLuckyWallpaperDto {
  @IsOptional()
  @IsString()
  sourceBizCode?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  palette?: string[];

  @IsOptional()
  @IsIn(['9:16', '16:9', '1:1'])
  aspectRatio?: '9:16' | '16:9' | '1:1';
}
