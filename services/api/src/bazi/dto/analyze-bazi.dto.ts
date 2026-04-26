import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AnalyzeBaziDto {
  @IsDateString()
  birthday!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  birthTime!: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'unknown'])
  gender?: 'male' | 'female' | 'unknown';

  @IsOptional()
  @IsString()
  @IsIn(['lite', 'professional'])
  mode?: 'lite' | 'professional';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  birthPlace?: string;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-12)
  @Max(14)
  timezoneOffset?: number;
}
