import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipProductEntity)
    private readonly membershipProductRepository: Repository<MembershipProductEntity>,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async getStatus(user: UserEntity) {
    const refreshedUser =
      await this.entitlementsService.refreshMembershipStatus(user);

    return {
      code: 0,
      message: 'ok',
      data: {
        vipStatus: 'inactive',
        vipExpiredAt: refreshedUser.vipExpiredAt?.toISOString() ?? null,
        isVipActive: false,
        rights: ['当前版本已下线会员售卖内容，功能以公开可用能力为准。'],
        products: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async listProducts() {
    return this.getPublishedProducts();
  }

  async getProductByCodeOrThrow(_code: string): Promise<MembershipProductEntity> {
    throw new BadRequestException('当前版本已下线会员售卖内容');
  }

  isVipActive(user: UserEntity | null) {
    return this.entitlementsService.isMembershipActive(user);
  }

  async activateMembership(userId: string, product: MembershipProductEntity) {
    return this.entitlementsService.grantMembershipFromProduct(userId, product);
  }

  serializeProduct(product: MembershipProductEntity) {
    return {
      code: product.code,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      priceFen: product.priceFen,
      priceLabel: `¥${(product.priceFen / 100).toFixed(2)}`,
      durationDays: product.durationDays,
      benefits: product.benefitsJson ?? [],
    };
  }

  private async getPublishedProducts() {
    return [];
  }
}
