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
          ? { id: 'r1', userId: 'u1' }
          : null,
      ),
    };
    const service = buildService(recordRepo);

    await expect(service.getOwnedRecordOrThrow('r1', 'u1')).resolves.toMatchObject({ id: 'r1' });
    await expect(service.getOwnedRecordOrThrow('r1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('describes bazi five elements without exposing raw counts', () => {
    const service = buildService();
    const record = {
      recordType: 'bazi',
      resultLevel: '木',
      score: '3',
      createdAt: new Date('2026-05-09T00:00:00.000Z'),
    };
    const resultData = {
      generatedAt: '2026-05-09T00:00:00.000Z',
      fiveElements: [
        { name: '木', value: 3 },
        { name: '火', value: 3 },
        { name: '土', value: 3 },
        { name: '金', value: 2 },
        { name: '水', value: 1 },
      ],
      reading: {},
    };

    const status = (service as any).buildStatusIndex(record, resultData);
    const dimensions = (service as any).buildStateDimensions(
      record,
      resultData,
      status,
    );
    const fullSections = (service as any).buildFullSections(
      record,
      resultData,
      {},
    );

    expect(status.rawLabel).toBe('木偏旺，水待补');
    expect(status.formula).not.toContain('÷');
    expect(status.notes.join('')).not.toMatch(/五行.{0,2}值/);
    expect(dimensions.map((item) => item.evidence).join('')).not.toMatch(/\d/);
    expect(fullSections[0].bullets.join('')).not.toMatch(/\d/);
  });
});
