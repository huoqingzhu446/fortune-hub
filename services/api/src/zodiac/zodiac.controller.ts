import { Controller, Get, Query } from '@nestjs/common';
import { ZodiacCompatibilityQueryDto } from './dto/zodiac-compatibility-query.dto';
import { ZodiacQueryDto } from './dto/zodiac-query.dto';
import { ZodiacYearlyQueryDto } from './dto/zodiac-yearly-query.dto';
import { ZodiacService } from './zodiac.service';

@Controller('zodiac')
export class ZodiacController {
  constructor(private readonly zodiacService: ZodiacService) {}

  @Get('daily')
  getDaily(@Query() query: ZodiacQueryDto) {
    return this.zodiacService.getDailyFortune(query.zodiac);
  }

  @Get('weekly')
  getWeekly(@Query() query: ZodiacQueryDto) {
    return this.zodiacService.getWeeklyFortune(query.zodiac);
  }

  @Get('yearly')
  getYearly(@Query() query: ZodiacYearlyQueryDto) {
    return this.zodiacService.getYearlyFortune(query.zodiac, query.year);
  }

  @Get('compatibility')
  getCompatibility(@Query() query: ZodiacCompatibilityQueryDto) {
    return this.zodiacService.getCompatibility(query.zodiac, query.partner);
  }

  @Get('knowledge')
  getKnowledge(@Query() query: ZodiacQueryDto) {
    return this.zodiacService.getKnowledge(query.zodiac);
  }
}
