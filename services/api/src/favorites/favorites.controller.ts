import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getFavorites(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.favoritesService.listFavorites(user);
  }

  @Post('toggle')
  async toggleFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ToggleFavoriteDto,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.favoritesService.toggleFavorite(user, dto);
  }
}
