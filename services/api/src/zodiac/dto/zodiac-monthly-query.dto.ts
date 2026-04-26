import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ZodiacMonthlyQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  zodiac?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;
}
