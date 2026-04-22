import { IsIn, IsOptional, IsString } from 'class-validator';
import { ZODIAC_SIGNS, type ZodiacSign } from '../zodiac.constants';

export class ZodiacQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(ZODIAC_SIGNS)
  zodiac?: ZodiacSign;
}
