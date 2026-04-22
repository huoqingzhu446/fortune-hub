import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdConfigEntity } from '../database/entities/ad-config.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { ReportsService } from '../reports/reports.service';
import { VerifyRewardDto } from './dto/verify-reward.dto';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(AdConfigEntity)
    private readonly adConfigRepository: Repository<AdConfigEntity>,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    private readonly reportsService: ReportsService,
  ) {}

  async verifyReward(user: UserEntity, dto: VerifyRewardDto) {
    const config = await this.adConfigRepository.findOne({
      where: {
        slotCode: dto.slotCode,
      },
    });

    if (!config || !config.enabled) {
      throw new BadRequestException('该激励位暂未开放');
    }

    const record = await this.userRecordRepository.findOne({
      where: {
        id: dto.recordId,
        userId: user.id,
      },
    });

    if (!record) {
      throw new NotFoundException('待解锁记录不存在');
    }

    record.isFullReportUnlocked = true;
    record.unlockType = 'ad_reward';
    const savedRecord = await this.userRecordRepository.save(record);

    return {
      code: 0,
      message: 'ok',
      data: {
        report: await this.reportsService.buildReportPayload(savedRecord, user),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
