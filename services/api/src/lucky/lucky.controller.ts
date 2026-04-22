import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { GenerateLuckyWallpaperDto } from './dto/generate-lucky-wallpaper.dto';
import { LuckyService } from './lucky.service';

@Controller('lucky')
export class LuckyController {
  constructor(
    private readonly luckyService: LuckyService,
    private readonly authService: AuthService,
  ) {}

  @Get('today')
  async getToday(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.luckyService.getToday(user);
  }

  @Get('signs/:bizCode')
  async getSignDetail(
    @Param('bizCode') bizCode: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.luckyService.getSignDetail(bizCode, user);
  }

  @Post('wallpaper/generate')
  async generateWallpaper(
    @Body() dto: GenerateLuckyWallpaperDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.luckyService.generateWallpaper(dto, user);
  }
}
