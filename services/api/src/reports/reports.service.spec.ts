import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  function buildService(recordRepo: unknown = {}) {
    return new ReportsService(
      recordRepo as never,
      {} as never,
      { listProducts: jest.fn() } as never,
      { buildFullReportAccess: jest.fn() } as never,
    );
  }

  it('only returns records owned by the current user', async () => {
    const recordRepo = {
      findOne: jest.fn(async ({ where }) =>
        where.id === 'r1' && where.userId === 'u1'
          ? { id: 'r1', userId: 'u1', recordType: 'emotion' }
          : null,
      ),
    };
    const service = buildService(recordRepo);

    await expect(service.getOwnedRecordOrThrow('r1', 'u1')).resolves.toMatchObject({ id: 'r1' });
    await expect(service.getOwnedRecordOrThrow('r1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides unsupported legacy report record types', async () => {
    const recordRepo = {
      findOne: jest.fn(async () => ({
        id: 'r2',
        userId: 'u1',
        recordType: 'legacy_profile',
      })),
    };
    const service = buildService(recordRepo);

    await expect(
      service.getOwnedRecordOrThrow('r2', 'u1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
