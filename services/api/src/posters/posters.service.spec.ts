import { BadRequestException } from '@nestjs/common';
import { PostersService } from './posters.service';

function createService(overrides: {
  reportsService?: Record<string, unknown>;
  config?: Map<string, string>;
} = {}) {
  const shareRecordRepository = {
    create: jest.fn((input: unknown) => input),
    save: jest.fn(async (input: unknown) => input),
  };
  const posterJobRepository = {};
  const fortuneContentRepository = {};
  const reportTemplateRepository = {};
  const reportsService =
    overrides.reportsService ??
    ({
      getOwnedRecordOrThrow: jest.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        recordType: 'emotion',
        sourceCode: 'emotion-check',
        resultTitle: '情绪自检',
        resultData: {
          score: 72,
          keywords: ['稳定', '观察'],
          dimensions: [{ label: '压力', value: 68, hint: '适中' }],
        },
        createdAt: new Date('2026-04-29T00:00:00.000Z'),
      })),
      buildReportPayload: jest.fn(async () => ({
        recordType: 'emotion',
        title: '情绪自检',
        summary: '当前状态整体平稳。',
        sharePoster: {
          themeName: 'fresh-mint',
          title: '情绪自检报告',
          subtitle: '当前状态整体平稳',
          accentText: '稳定 · 观察',
          footerText: '仅供自我观察参考',
        },
      })),
    } as Record<string, unknown>);
  const configService = {
    get: jest.fn((key: string, fallback?: string) =>
      overrides.config?.get(key) ?? fallback,
    ),
  };
  const posterRendererService = {
    resolvePosterLayout: jest.fn(() => ({
      size: '1088x1472',
      width: 1088,
      height: 1472,
      kind: 'portrait',
    })),
    renderPoster: jest.fn(async () => ({
      imageBuffer: Buffer.from('png'),
      imageDataUrl: 'data:image/png;base64,cG5n',
      usedProviderBackground: false,
    })),
  };

  const service = new PostersService(
    shareRecordRepository as never,
    posterJobRepository as never,
    fortuneContentRepository as never,
    reportTemplateRepository as never,
    reportsService as never,
    configService as never,
    posterRendererService as never,
  );

  return { service, posterRendererService, shareRecordRepository };
}

describe('PostersService review edition', () => {
  it('renders allowed report posters', async () => {
    const { service, posterRendererService, shareRecordRepository } =
      createService();

    const response = await service.generatePoster(
      { recordId: 'record-1', size: '1088x1472' },
      { id: 'user-1' } as never,
    );

    expect(posterRendererService.renderPoster).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'emotion',
        title: '心理健康评测',
        emotionPoster: expect.any(Object),
      }),
      null,
      expect.objectContaining({ size: '1088x1472' }),
    );
    expect(response.data.poster).toEqual(
      expect.objectContaining({
        provider: 'template',
        providerStatus: 'rendered',
        imageDataUrl: 'data:image/png;base64,cG5n',
      }),
    );
    expect(shareRecordRepository.save).toHaveBeenCalled();
  });

  it('rejects source-type poster generation in the review edition', async () => {
    const { service } = createService();

    await expect(
      service.generatePoster({ sourceType: 'report' }, null),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects downlined report poster types', async () => {
    const { service } = createService({
      reportsService: {
        getOwnedRecordOrThrow: jest.fn(async () => ({
          id: 'record-1',
          userId: 'user-1',
          recordType: 'bazi',
          sourceCode: 'legacy',
          resultTitle: 'legacy',
          resultData: {},
          createdAt: new Date('2026-04-29T00:00:00.000Z'),
        })),
        buildReportPayload: jest.fn(async () => ({
          recordType: 'bazi',
          title: 'legacy',
          summary: 'legacy',
          sharePoster: {
            themeName: 'fresh-mint',
            title: 'legacy',
            subtitle: 'legacy',
            accentText: 'legacy',
            footerText: 'legacy',
          },
        })),
      },
    });

    await expect(
      service.generatePoster(
        { recordId: 'record-1', size: '1088x1472' },
        { id: 'user-1' } as never,
      ),
    ).rejects.toThrow('当前审核版已下线该类分享海报');
  });
});
