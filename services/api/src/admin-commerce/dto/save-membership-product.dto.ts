import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveMembershipProductDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1)
  priceFen!: number;

  @IsInt()
  @Min(1)
  durationDays!: number;

  @IsArray()
  @IsString({ each: true })
  benefits!: string[];

  @IsInt()
  @Min(1)
  sortOrder!: number;

  @IsString()
  @IsIn(['draft', 'published'])
  status!: 'draft' | 'published';
}
