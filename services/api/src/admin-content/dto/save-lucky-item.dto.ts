import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveLuckyItemDto {
  @IsString()
  @MaxLength(64)
  bizCode!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @IsString()
  @MaxLength(64)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  publishDate?: string | null;

  @IsInt()
  @Min(1)
  sortOrder!: number;

  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';

  @IsObject()
  contentJson!: Record<string, unknown>;
}
