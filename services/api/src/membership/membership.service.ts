import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_MEMBERSHIP_PRODUCTS } from '../commerce/commerce.defaults';
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
    await this.ensureDefaultProducts();
    const refreshedUser =
      await this.entitlementsService.refreshMembershipStatus(user);
    const products = await this.getPublishedProducts();
    const active = this.isVipActive(refreshedUser);

    return {
      code: 0,
      message: 'ok',
      data: {
        vipStatus: active ? 'active' : 'inactive',
        vipExpiredAt: refreshedUser.vipExpiredAt?.toISOString() ?? null,
        isVipActive: active,
        rights: active
          ? ['查看全部完整版解读', '历史记录自动解锁', '不限次数海报生成']
          : [
              '基础结果查看',
              '会员开通后自动解锁全部记录',
              '会员有效期内不限次数生成海报',
            ],
        products: products.map((product) => this.serializeProduct(product)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async listProducts() {
    await this.ensureDefaultProducts();
    return this.getPublishedProducts();
  }

  async getProductByCodeOrThrow(code: string) {
    await this.ensureDefaultProducts();
    const product = await this.membershipProductRepository.findOne({
      where: {
        code,
        status: 'published',
      },
    });

    if (!product) {
      throw new NotFoundException('会员商品不存在');
    }

    return product;
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
    return this.membershipProductRepository.find({
      where: {
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  private async ensureDefaultProducts() {
    const count = await this.membershipProductRepository.count();

    if (count > 0) {
      return;
    }

    await this.membershipProductRepository.save(
      DEFAULT_MEMBERSHIP_PRODUCTS.map((item) =>
        this.membershipProductRepository.create({
          ...item,
          benefitsJson: [...item.benefitsJson],
        }),
      ),
    );
  }
}
