import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService,
    private readonly authService: AuthService,
  ) {}

  @Get('index')
  async getExploreIndex(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.exploreService.getExploreIndex(user);
  }
}
