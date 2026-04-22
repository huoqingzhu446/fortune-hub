import { IsIn, IsOptional, IsString } from 'class-validator';

const ZODIAC_SIGNS = [
  '白羊座',
  '金牛座',
  '双子座',
  '巨蟹座',
  '狮子座',
  '处女座',
  '天秤座',
  '天蝎座',
  '射手座',
  '摩羯座',
  '水瓶座',
  '双鱼座',
] as const;

export class ZodiacDailyQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(ZODIAC_SIGNS)
  zodiac?: (typeof ZODIAC_SIGNS)[number];
}
