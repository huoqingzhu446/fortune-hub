import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AnalyzeBaziDto } from './dto/analyze-bazi.dto';
import { BaziService } from './bazi.service';

@Controller('bazi')
export class BaziController {
  constructor(
    private readonly baziService: BaziService,
    private readonly authService: AuthService,
  ) {}

  @Post('analyze')
  async analyze(
    @Body() dto: AnalyzeBaziDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.baziService.analyze(dto, user);
  }

  @Post('professional/analyze')
  async analyzeProfessional(
    @Body() dto: AnalyzeBaziDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.baziService.analyzeProfessional(dto, user);
  }

  @Get('history')
  async getHistory(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.baziService.getHistory(user);
  }

  @Get('professional/records/:recordId/detail')
  async getProfessionalDetail(
    @Param('recordId') recordId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.baziService.getProfessionalDetail(recordId, user);
  }

  @Get('birth-places')
  searchBirthPlaces(
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return this.baziService.searchBirthPlaces(keyword, Number(limit));
  }
}
