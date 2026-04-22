import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SaveFortuneContentDto {
  @IsString()
  @MaxLength(32)
  contentType!: string;

  @IsString()
  @MaxLength(64)
  bizCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  publishDate?: string | null;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @IsString()
  @IsIn(['draft', 'published'])
  status!: 'draft' | 'published';

  @IsObject()
  contentJson!: Record<string, unknown>;
}
