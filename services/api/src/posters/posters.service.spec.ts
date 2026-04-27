import { PostersService } from './posters.service';

function buildZodiacTodayResponse() {
  return {
    data: {
      zodiac: '摩羯座',
      profile: {
        element: '土',
      },
      score: {
        overall: 78,
      },
      theme: {
        summary: '今天适合稳步推进，耐心会替你赢得空间。',
        keywords: ['目标', '责任', '耐力'],
      },
      dimensions: [],
      lucky: {
        color: '岩灰蓝',
        item: '木质书签',
        number: '10',
      },
      action: {
        title: '完成一个“目标”小行动',
        description: '把任务拆小，把节奏放稳。今天的每一步都算数。',
      },
      compatibility: {
        bestMatch: '处女座',
      },
      dayparts: [
        {
          hint: '上午先推进一小步。',
        },
      ],
      sharePoster: {
        title: '摩羯座今日气运',
        subtitle: '稳步推进，耐心会替你赢得空间。',
        accentText: '完成一个“目标”小行动',
        footerText: '幸运色 岩灰蓝 · 幸运数字 10',
        themeName: 'sage-stone',
      },
    },
  };
}

describe('PostersService', () => {
  it('renders zodiac posters with the template provider only', async () => {
    const shareRecordRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn(async (input: unknown) => input),
    };
    const posterRendererService = {
      resolvePosterLayout: jest.fn(() => ({
        size: '1080x1440',
        width: 1080,
        height: 1440,
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
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        getTodayFortune: jest.fn(async () => buildZodiacTodayResponse()),
      } as never,
      {
        get: jest.fn(() => undefined),
      } as never,
      posterRendererService as never,
    );

    const response = await service.generatePoster(
      {
        sourceType: 'zodiac_today',
        bizCode: '摩羯座',
        size: '1080x1440',
      },
      null,
    );

    expect(posterRendererService.renderPoster).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'zodiac_today',
        title: '摩羯座今日运势',
        energyValue: '78',
        chips: ['目标', '责任', '耐力'],
      }),
      null,
      expect.objectContaining({
        size: '1080x1440',
      }),
    );
    expect(response.data.poster).toEqual(
      expect.objectContaining({
        provider: 'template',
        providerStatus: 'rendered',
        templateId: 'zodiac-today-energy-card-v1',
        providerImageUrl: null,
        providerRequestId: null,
        providerError: null,
        format: 'png',
      }),
    );
    expect(shareRecordRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'template',
        status: 'rendered',
        prompt: 'zodiac-today-energy-card-v1',
      }),
    );
  });
});
