import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class EntitlementsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  isMembershipActive(user: UserEntity | null | undefined) {
    if (!user || user.vipStatus !== 'active' || !user.vipExpiredAt) {
      return false;
    }

    return user.vipExpiredAt.getTime() > Date.now();
  }

  async refreshMembershipStatus(user: UserEntity) {
    if (
      this.isMembershipActive(user) ||
      !user.vipExpiredAt ||
      user.vipStatus === 'inactive'
    ) {
      return user;
    }

    user.vipStatus = 'inactive';
    return this.userRepository.save(user);
  }

  async grantMembershipFromProduct(
    userId: string,
    product: Pick<MembershipProductEntity, 'durationDays'>,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const now = Date.now();
    const baseTime =
      user.vipExpiredAt && user.vipExpiredAt.getTime() > now
        ? user.vipExpiredAt.getTime()
        : now;
    const nextExpiredAt = new Date(
      baseTime + product.durationDays * 24 * 60 * 60 * 1000,
    );

    user.vipStatus = 'active';
    user.vipExpiredAt = nextExpiredAt;

    return this.userRepository.save(user);
  }

  async findUserById(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  buildFullReportAccess(record: UserRecordEntity, user: UserEntity) {
    return {
      isFullReportUnlocked: true,
      persistedUnlocked: true,
      unlockType: 'free',
      hasVipAccess: false,
      requiresLogin: false,
    };
  }
}
