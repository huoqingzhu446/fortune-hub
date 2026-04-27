import sharp from 'sharp';
import { PosterRendererService } from './poster-renderer.service';

describe('PosterRendererService', () => {
  it('renders zodiac today templates as 1080x1440 PNG images', async () => {
    const service = new PosterRendererService();
    const layout = service.resolvePosterLayout('1088x1472', 'zodiac_today');
    const rendered = await service.renderPoster(
      {
        sourceType: 'zodiac_today',
        title: '摩羯座今日运势',
        subtitle: '稳步推进，耐心会替你赢得空间。',
        accentText: '完成一个“目标”小行动',
        footerText: '幸运色 岩灰蓝 · 幸运数字 10',
        summary: '把任务拆小，把节奏放稳。今天的每一步都算数。',
        themeName: 'zodiac-blue-purple',
        eyebrowText: 'ZODIAC TODAY',
        chips: ['目标', '责任', '耐力'],
        metrics: [
          {
            label: '幸运色',
            value: '岩灰蓝',
            hint: '幸运色彩助力好运',
          },
          {
            label: '幸运物',
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
      },
      null,
      layout,
    );
    const metadata = await sharp(rendered.imageBuffer).metadata();

    expect(layout).toEqual(
      expect.objectContaining({
        size: '1080x1440',
        width: 1080,
        height: 1440,
      }),
    );
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1440);
    expect(rendered.imageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(rendered.usedProviderBackground).toBe(false);
  });
});
