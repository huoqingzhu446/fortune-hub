import { BadRequestException } from '@nestjs/common';
import { AdsService } from './ads.service';

describe('AdsService', () => {
  it('unlocks owned report after enabled reward slot verification', async () => {
    const record = { id: 'r1', userId: 'u1', isFullReportUnlocked: false, unlockType: null };
    const adRepo = {
      findOne: jest.fn(async () => ({ slotCode: 'reward', enabled: true })),
    };
    const recordRepo = {
      findOne: jest.fn(async () => record),
      save: jest.fn(async (input) => input),
    };
    const reportsService = {
      buildReportPayload: jest.fn(async () => ({ recordId: 'r1', access: { isFullReportUnlocked: true } })),
    };
    const service = new AdsService(adRepo as never, recordRepo as never, reportsService as never);

    const response = await service.verifyReward({ id: 'u1' } as never, {
      slotCode: 'reward',
      recordId: 'r1',
    });

    expect(recordRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      isFullReportUnlocked: true,
      unlockType: 'ad_reward',
    }));
    expect(response.data.report.recordId).toBe('r1');
  });

  it('rejects disabled reward slot', async () => {
    const service = new AdsService(
      { findOne: jest.fn(async () => ({ enabled: false })) } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.verifyReward({ id: 'u1' } as never, { slotCode: 'reward', recordId: 'r1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
