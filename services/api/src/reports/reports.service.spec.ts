import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('only returns records owned by the current user', async () => {
    const recordRepo = {
      findOne: jest.fn(async ({ where }) =>
        where.id === 'r1' && where.userId === 'u1'
          ? { id: 'r1', userId: 'u1' }
          : null,
      ),
    };
    const service = new ReportsService(
      recordRepo as never,
      {} as never,
      {} as never,
      { isVipActive: jest.fn(), listProducts: jest.fn() } as never,
    );

    await expect(service.getOwnedRecordOrThrow('r1', 'u1')).resolves.toMatchObject({ id: 'r1' });
    await expect(service.getOwnedRecordOrThrow('r1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
