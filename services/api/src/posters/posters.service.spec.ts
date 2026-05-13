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
        imageBuffer: Buffer.from('jpg'),
        imageDataUrl: 'data:image/jpeg;base64,anBn',
        format: 'jpg',
        mimeType: 'image/jpeg',
        extension: 'jpg',
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
        title: '星运档案',
        energyValue: '78',
        chips: ['稳定', '坚韧', '长期'],
        zodiacPoster: expect.objectContaining({
          tagText: '星运档案',
          signName: '摩羯座',
          elementLabel: '土象星座',
          birthPlace: '待完善',
        }),
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
        templateId: 'zodiac-archive-poster-941x1672-v1',
        providerImageUrl: null,
        providerRequestId: null,
        providerError: null,
        format: 'jpg',
        imageDataUrl: 'data:image/jpeg;base64,anBn',
        downloadFileName: expect.stringMatching(/\.jpg$/),
      }),
    );
    expect(shareRecordRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'template',
        status: 'rendered',
        prompt: 'zodiac-archive-poster-941x1672-v1',
      }),
    );
  });

  it('builds bazi report posters with structured chart details', async () => {
    const shareRecordRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn(async (input: unknown) => input),
    };
    const posterRendererService = {
      resolvePosterLayout: jest.fn(() => ({
        size: '941x1672',
        width: 941,
        height: 1672,
        kind: 'portrait',
      })),
      renderPoster: jest.fn(async () => ({
        imageBuffer: Buffer.from('png'),
        imageDataUrl: 'data:image/png;base64,cG5n',
        usedProviderBackground: false,
      })),
    };
    const resultData = {
      title: '木势专业校正版',
      subtitle: '已按节气换月、立春年界与真太阳时校正。',
      summary: '乙木日主，四柱呈现木势更明显。',
      chart: {
        yearPillar: '丙子',
        monthPillar: '丁酉',
        dayPillar: '乙卯',
        hourPillar: '辛巳',
      },
      inputSnapshot: {
        birthday: '1996-10-21',
        birthTime: '09:28',
        birthPlace: '杭州',
      },
      baseProfile: {
        birthday: '1996-10-21',
        birthTime: '09:28',
        birthPlace: '杭州',
      },
      dominantElement: { name: '木', value: 4 },
      supportElement: { name: '水', value: 2 },
      dayMasterAnalysis: {
        dayStem: '乙',
        dayElement: '木',
        supportScore: 5,
        pressureScore: 3,
        balanceScore: 2,
        usefulElements: [
          { name: '水', reason: '日主偏弱，先取印星生扶。' },
          { name: '木', reason: '同类比劫可补足行动和承压能力。' },
        ],
      },
      reading: {
        rhythm: '当前更建议你用“木主轴 + 水补位”的方式安排节奏。',
      },
      practicalTips: {
        dailyFocus: '今天适合围绕舒展来安排主要任务。',
      },
    };
    const reportsService = {
      getOwnedRecordOrThrow: jest.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        recordType: 'bazi',
        sourceCode: 'professional-bazi-chart',
        resultTitle: '木势专业校正版',
        resultData,
        createdAt: new Date('2026-04-29T00:00:00.000Z'),
      })),
      buildReportPayload: jest.fn(async () => ({
        recordType: 'bazi',
        title: '木势专业校正版',
        summary: resultData.summary,
        sharePoster: {
          themeName: 'oriental-gold',
          title: '我的八字命盘',
          subtitle: '根据出生日期与出生地生成的专属命理画像',
          accentText: '乙木日主 · 木旺 · 喜用水木',
          footerText: '知命而后，更懂自己',
        },
      })),
    };
    const service = new PostersService(
      shareRecordRepository as never,
      {} as never,
      {} as never,
      {} as never,
      reportsService as never,
      {} as never,
      {} as never,
      {
        get: jest.fn(() => undefined),
      } as never,
      posterRendererService as never,
    );

    const response = await service.generatePoster(
      {
        recordId: 'record-1',
        size: '941x1672',
      },
      { id: 'user-1' } as never,
    );

    expect(posterRendererService.resolvePosterLayout).toHaveBeenCalledWith(
      '941x1672',
      'bazi',
    );
    expect(posterRendererService.renderPoster).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'bazi',
        title: '我的八字命盘',
        subtitle: '根据出生日期与出生地生成的专属命理画像',
        baziPoster: expect.objectContaining({
          calendarText: '1996年10月21日 09:28',
          birthPlace: '杭州',
          dayMaster: '乙木',
          wuxingTrend: '木旺',
          favorableElements: '水木',
          pillars: [
            { label: '年柱', stem: '丙', branch: '子' },
            { label: '月柱', stem: '丁', branch: '酉' },
            { label: '日柱', stem: '乙', branch: '卯' },
            { label: '时柱', stem: '辛', branch: '巳' },
          ],
        }),
      }),
      null,
      expect.objectContaining({
        size: '941x1672',
      }),
    );
    expect(response.data.poster).toEqual(
      expect.objectContaining({
        width: 941,
        height: 1672,
        size: '941x1672',
        templateId: 'bazi-share-poster-941x1672-v1',
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

  it('rejects external mini program code paths before requesting wxacode', async () => {
    const fetchMock = jest.fn();
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
      ['POSTER_MINI_PROGRAM_CODE_REQUIRED', 'true'],
      ['POSTER_ZODIAC_TODAY_WXACODE_PATH', 'https://example.com/bad'],
    ]);
    const configService = {
      get: jest.fn(
        (key: string, fallback?: string) => config.get(key) ?? fallback,
      ),
    };
    const originalFetch = global.fetch;
    global.fetch = fetchMock as never;

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

      await expect(
        service.generatePoster(
          {
            sourceType: 'zodiac_today',
            bizCode: '摩羯座',
            size: '1088x1472',
          },
          null,
        ),
      ).rejects.toThrow('小程序码 path 不能包含协议或外链地址');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
