import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_MEMBERSHIP_PRODUCTS } from '../commerce/commerce.defaults';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { SaveMembershipProductDto } from './dto/save-membership-product.dto';

@Injectable()
export class AdminCommerceService {
  constructor(
    @InjectRepository(MembershipProductEntity)
    private readonly membershipProductRepository: Repository<MembershipProductEntity>,
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

  private async ensureDefaults() {
    const membershipCount = await this.membershipProductRepository.count();

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
  }
}
