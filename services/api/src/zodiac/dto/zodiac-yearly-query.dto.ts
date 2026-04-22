import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ZodiacQueryDto } from './zodiac-query.dto';

export class ZodiacYearlyQueryDto extends ZodiacQueryDto {
  @IsOptional()
  @IsInt()
  @Min(2024)
  @Max(2099)
  year?: number;
}
