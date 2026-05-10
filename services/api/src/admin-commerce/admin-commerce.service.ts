import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_MEMBERSHIP_PRODUCTS } from '../commerce/commerce.defaults';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { SaveMembershipProductDto } from './dto/save-membership-product.dto';

@Injectable()
export class AdminCommerceService {
  constructor(
    @InjectRepository(MembershipProductEntity)
    private readonly membershipProductRepository: Repository<MembershipProductEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
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

  async deleteMembershipProduct(code: string) {
    const product = await this.membershipProductRepository.findOne({
      where: { code },
    });

    if (!product) {
      throw new NotFoundException('会员商品不存在');
    }

    await this.membershipProductRepository.remove(product);

    return {
      code: 0,
      message: 'ok',
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };
  }

  async updateMembershipProductStatus(code: string, status: string) {
    if (!['draft', 'published'].includes(status)) {
      throw new BadRequestException('无效的状态值');
    }

    const product = await this.membershipProductRepository.findOne({
      where: { code },
    });

    if (!product) {
      throw new NotFoundException('会员商品不存在');
    }

    product.status = status;
    await this.membershipProductRepository.save(product);

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeMembershipProduct(product),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getOrders(query: { page: number; pageSize: number; status?: string }) {
    const where: Record<string, string> = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.orderRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: items.map((o) => ({
          id: o.id,
          userId: o.userId,
          orderNo: o.orderNo,
          productCode: o.productCode,
          productTitle: o.productTitle,
          amountFen: o.amountFen,
          amountYuan: (o.amountFen / 100).toFixed(2),
          orderType: o.orderType,
          status: o.status,
          transactionNo: o.transactionNo,
          paidAt: o.paidAt?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
        })),
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getOrderStats() {
    const [total, paid, paidOrders] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: 'paid' } }),
      this.orderRepository.find({
        where: { status: 'paid' },
        select: ['amountFen', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 500,
      }),
    ]);

    const totalRevenueFen = paidOrders.reduce((s, o) => s + o.amountFen, 0);

    const now = new Date();
    const thisMonth = paidOrders.filter(
      (o) =>
        o.createdAt.getFullYear() === now.getFullYear() &&
        o.createdAt.getMonth() === now.getMonth(),
    );
    const thisMonthRevenueFen = thisMonth.reduce((s, o) => s + o.amountFen, 0);

    return {
      code: 0,
      message: 'ok',
      data: {
        totalOrders: total,
        paidOrders: paid,
        totalRevenueFen,
        totalRevenueYuan: (totalRevenueFen / 100).toFixed(2),
        thisMonthRevenueFen,
        thisMonthRevenueYuan: (thisMonthRevenueFen / 100).toFixed(2),
        conversionRate: total > 0 ? ((paid / total) * 100).toFixed(1) : '0',
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
