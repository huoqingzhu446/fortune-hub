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

  it('requests permanent wxacode images with path payloads', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/cgi-bin/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'wechat-token',
            expires_in: 7200,
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      if (url.includes('/wxa/getwxacode?')) {
        return new Response(Buffer.from('wxacode'), {
          status: 200,
          headers: {
            'content-type': 'image/png',
          },
        });
      }

      throw new Error(`unexpected fetch ${url}`);
    });
    global.fetch = fetchMock as never;

    const shareRecordRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn(async (input: unknown) => input),
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
    const config = new Map<string, string>([
      ['WECHAT_APP_ID', 'appid'],
      ['WECHAT_APP_SECRET', 'secret'],
      ['WECHAT_MINI_PROGRAM_ENV_VERSION', 'release'],
      ['WECHAT_WXACODE_WIDTH', '430'],
      [
        'POSTER_ZODIAC_TODAY_WXACODE_PATH',
        'pages/zodiac/index?zodiac={zodiac}',
      ],
    ]);
    const configService = {
      get: jest.fn(
        (key: string, fallback?: string) => config.get(key) ?? fallback,
      ),
    };

    try {
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
        configService as never,
        posterRendererService as never,
      );

      const response = await service.generatePoster(
        {
          sourceType: 'zodiac_today',
          bizCode: '摩羯座',
          size: '1088x1472',
        },
        null,
      );
      const wxacodeCall = fetchMock.mock.calls.find(([input]) =>
        String(input).includes('/wxa/getwxacode?'),
      );

      expect(wxacodeCall).toBeDefined();
      expect(String(wxacodeCall?.[0])).toContain('/wxa/getwxacode?');

      const body = JSON.parse(
        String((wxacodeCall?.[1] as RequestInit | undefined)?.body),
      ) as Record<string, unknown>;

      expect(body).toEqual(
        expect.objectContaining({
          path: 'pages/zodiac/index?zodiac=%E6%91%A9%E7%BE%AF%E5%BA%A7',
          env_version: 'release',
          width: 430,
          auto_color: false,
          is_hyaline: false,
        }),
      );
      expect(body).not.toHaveProperty('scene');
      expect(body).not.toHaveProperty('page');
      expect(body).not.toHaveProperty('check_path');
      expect(posterRendererService.renderPoster).toHaveBeenCalledWith(
        expect.objectContaining({
          miniProgramCodeDataUrl: expect.stringMatching(
            /^data:image\/png;base64,/,
          ),
        }),
        null,
        expect.objectContaining({
          size: '1088x1472',
        }),
      );
      expect(response.data.poster).toEqual(
        expect.objectContaining({
          miniProgramCodeStatus: 'embedded',
        }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
