import sharp from 'sharp';
import { PosterRendererService } from './poster-renderer.service';

describe('PosterRendererService', () => {
  it('renders profile templates as 1088x1472 PNG images', async () => {
    const service = new PosterRendererService();
    const layout = service.resolvePosterLayout('1088x1472', 'profile_today');
    const rendered = await service.renderPoster(
      {
        sourceType: 'profile_today',
        title: '今日状态画像',
        subtitle: '稳步推进，耐心会替你赢得空间。',
        accentText: '完成一个“目标”小行动',
        footerText: '代表色 岩灰蓝 · 节奏数字 10',
        summary: '把任务拆小，把节奏放稳。今天的每一步都算数。',
        themeName: 'profile-blue-purple',
        eyebrowText: 'PROFILE TODAY',
        chips: ['目标', '责任', '耐力'],
        metrics: [
          {
            label: '代表色',
            value: '岩灰蓝',
            hint: '色彩提示保持节奏',
          },
          {
            label: '推荐物',
            value: '木质书签',
            hint: '随身携带，带来灵感与专注',
          },
          {
            label: '行动签',
            value: '完成一个“目标”小行动',
            hint: '行动带来改变',
          },
        ],
        highlightTitle: '今日提醒',
        highlightLines: [],
        zodiacName: '摩羯座',
        zodiacGlyph: '摩羯',
        zodiacEnglish: 'Capricorn',
        energyValue: '78',
        miniProgramCodeDataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lbcN5QAAAABJRU5ErkJggg==',
      },
      null,
      layout,
    );
    const metadata = await sharp(rendered.imageBuffer).metadata();

    expect(layout).toEqual(
      expect.objectContaining({
        size: '1088x1472',
        width: 1088,
        height: 1472,
      }),
    );
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(1088);
    expect(metadata.height).toBe(1472);
    expect(rendered.format).toBe('png');
    expect(rendered.mimeType).toBe('image/png');
    expect(rendered.extension).toBe('png');
    expect(rendered.imageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(rendered.usedProviderBackground).toBe(false);
  });

  it('renders profile report posters as 941x1672 PNG images', async () => {
    const service = new PosterRendererService();
    const layout = service.resolvePosterLayout('941x1672', 'profile_report');
    const rendered = await service.renderPoster(
      {
        sourceType: 'profile_report',
        title: '我的资料报告',
        subtitle: '根据基础资料生成的专属状态画像',
        accentText: '状态平稳 · 节奏清晰 · 适合复盘',
        footerText: '记录当下，更懂自己',
        summary: '状态温和，内心有韧性，适合稳步推进。',
        themeName: 'oriental-gold',
        eyebrowText: 'FORTUNE HUB SHARE POSTER',
        chips: ['稳定', '复盘', '行动'],
        metrics: [],
        highlightLines: [],
        miniProgramCodeDataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lbcN5QAAAABJRU5ErkJggg==',
      },
      null,
      layout,
    );
    const metadata = await sharp(rendered.imageBuffer).metadata();

    expect(layout).toEqual(
      expect.objectContaining({
        size: '941x1672',
        width: 941,
        height: 1672,
      }),
    );
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(941);
    expect(metadata.height).toBe(1672);
    expect(rendered.format).toBe('png');
    expect(rendered.mimeType).toBe('image/png');
    expect(rendered.extension).toBe('png');
    expect(rendered.imageDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
