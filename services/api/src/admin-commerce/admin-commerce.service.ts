import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_AD_CONFIGS, DEFAULT_MEMBERSHIP_PRODUCTS } from '../commerce/commerce.defaults';
import { AdConfigEntity } from '../database/entities/ad-config.entity';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { SaveAdConfigDto } from './dto/save-ad-config.dto';
import { SaveMembershipProductDto } from './dto/save-membership-product.dto';

@Injectable()
export class AdminCommerceService {
  constructor(
    @InjectRepository(MembershipProductEntity)
    private readonly membershipProductRepository: Repository<MembershipProductEntity>,
    @InjectRepository(AdConfigEntity)
    private readonly adConfigRepository: Repository<AdConfigEntity>,
  ) {}

  async getMembershipProducts() {
    await this.ensureDefaults();
    const items = await this.membershipProductRepository.find({
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: items.map((item) => this.serializeMembershipProduct(item)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async createMembershipProduct(dto: SaveMembershipProductDto) {
    const exists = await this.membershipProductRepository.findOne({
      where: { code: dto.code },
    });

    if (exists) {
      throw new BadRequestException('会员商品 code 已存在');
    }

    const saved = await this.membershipProductRepository.save(
      this.membershipProductRepository.create({
        code: dto.code.trim(),
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        description: dto.description?.trim() || null,
        priceFen: dto.priceFen,
        durationDays: dto.durationDays,
        benefitsJson: dto.benefits.map((item) => item.trim()).filter(Boolean),
        sortOrder: dto.sortOrder,
        status: dto.status,
      }),
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeMembershipProduct(saved),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updateMembershipProduct(code: string, dto: SaveMembershipProductDto) {
    const product = await this.membershipProductRepository.findOne({
      where: { code },
    });

    if (!product) {
      throw new NotFoundException('会员商品不存在');
    }

    product.code = dto.code.trim();
    product.title = dto.title.trim();
    product.subtitle = dto.subtitle?.trim() || null;
    product.description = dto.description?.trim() || null;
    product.priceFen = dto.priceFen;
    product.durationDays = dto.durationDays;
    product.benefitsJson = dto.benefits.map((item) => item.trim()).filter(Boolean);
    product.sortOrder = dto.sortOrder;
    product.status = dto.status;

    const saved = await this.membershipProductRepository.save(product);

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeMembershipProduct(saved),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getAdConfigs() {
    await this.ensureDefaults();
    const items = await this.adConfigRepository.find({
      order: {
        updatedAt: 'DESC',
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: items.map((item) => this.serializeAdConfig(item)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updateAdConfig(id: string, dto: SaveAdConfigDto) {
    const config = await this.adConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('广告配置不存在');
    }

    config.slotCode = dto.slotCode.trim();
    config.title = dto.title.trim();
    config.placement = dto.placement.trim();
    config.rewardType = dto.rewardType.trim();
    config.rewardDescription = dto.rewardDescription?.trim() || null;
    config.enabled = dto.enabled;
    config.configJson = dto.configJson ?? {};

    const saved = await this.adConfigRepository.save(config);

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeAdConfig(saved),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private serializeMembershipProduct(item: MembershipProductEntity) {
    return {
      code: item.code,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      priceFen: item.priceFen,
      durationDays: item.durationDays,
      benefits: item.benefitsJson ?? [],
      sortOrder: item.sortOrder,
      status: item.status,
    };
  }

  private serializeAdConfig(item: AdConfigEntity) {
    return {
      id: item.id,
      slotCode: item.slotCode,
      title: item.title,
      placement: item.placement,
      rewardType: item.rewardType,
      rewardDescription: item.rewardDescription,
      enabled: item.enabled,
      configJson: item.configJson ?? {},
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async ensureDefaults() {
    const [membershipCount, adCount] = await Promise.all([
      this.membershipProductRepository.count(),
      this.adConfigRepository.count(),
    ]);

    if (membershipCount === 0) {
      await this.membershipProductRepository.save(
        DEFAULT_MEMBERSHIP_PRODUCTS.map((item) =>
          this.membershipProductRepository.create({
            ...item,
            benefitsJson: [...item.benefitsJson],
          }),
        ),
      );
    }

    if (adCount === 0) {
      await this.adConfigRepository.save(
        DEFAULT_AD_CONFIGS.map((item) =>
          this.adConfigRepository.create({
            ...item,
            configJson: { ...item.configJson },
          }),
        ),
      );
    }
  }
}
