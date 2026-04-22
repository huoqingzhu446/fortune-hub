import { IsIn, IsOptional, IsString } from 'class-validator';
import { ZODIAC_SIGNS, type ZodiacSign } from '../zodiac.constants';
import { ZodiacQueryDto } from './zodiac-query.dto';

export class ZodiacCompatibilityQueryDto extends ZodiacQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(ZODIAC_SIGNS)
  partner?: ZodiacSign;
}
