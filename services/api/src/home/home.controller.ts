import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly authService: AuthService,
  ) {}

  @Get('index')
  async getHomeIndex(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.homeService.getHomeIndex(user);
  }
}
