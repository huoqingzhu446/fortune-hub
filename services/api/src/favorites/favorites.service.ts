import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from '../database/entities/favorite.entity';
import { UserEntity } from '../database/entities/user.entity';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async listFavorites(user: UserEntity) {
    const items = await this.favoriteRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });

    return this.buildEnvelope({
      items: items.map((item) => this.serializeFavorite(item)),
    });
  }

  async toggleFavorite(user: UserEntity, dto: ToggleFavoriteDto) {
    const existing = await this.favoriteRepository.findOne({
      where: {
        userId: user.id,
        itemType: dto.itemType,
        itemKey: dto.itemKey,
      },
    });

    if (existing) {
      await this.favoriteRepository.delete({ id: existing.id });
      return this.buildEnvelope({
        active: false,
        item: this.serializeFavorite(existing),
      });
    }

    const created = await this.favoriteRepository.save(
      this.favoriteRepository.create({
        userId: user.id,
        itemType: dto.itemType,
        itemKey: dto.itemKey,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        icon: dto.icon?.trim() || null,
        route: dto.route.trim(),
        extraJson: dto.extraJson ?? null,
      }),
    );

    return this.buildEnvelope({
      active: true,
      item: this.serializeFavorite(created),
    });
  }

  async listRecentFavorites(userId: string, limit = 2) {
    const items = await this.favoriteRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return items.map((item) => this.serializeFavorite(item));
  }

  async countFavorites(userId: string) {
    return this.favoriteRepository.count({
      where: {
        userId,
      },
    });
  }

  private serializeFavorite(item: FavoriteEntity) {
    return {
      id: item.id,
      itemType: item.itemType,
      itemKey: item.itemKey,
      title: item.title,
      summary: item.summary ?? '',
      icon: item.icon ?? '藏',
      route: item.route,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
