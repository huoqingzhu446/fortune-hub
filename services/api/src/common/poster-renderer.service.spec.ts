import sharp from 'sharp';
import { PosterRendererService } from './poster-renderer.service';

describe('PosterRendererService', () => {
  it('renders zodiac today templates as 1088x1472 JPG images', async () => {
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
    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(1088);
    expect(metadata.height).toBe(1472);
    expect(rendered.format).toBe('jpg');
    expect(rendered.mimeType).toBe('image/jpeg');
    expect(rendered.extension).toBe('jpg');
    expect(rendered.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(rendered.usedProviderBackground).toBe(false);
  });

  it('renders bazi share posters as 941x1672 PNG images', async () => {
    const service = new PosterRendererService();
    const layout = service.resolvePosterLayout('941x1672', 'bazi');
    const rendered = await service.renderPoster(
      {
        sourceType: 'bazi',
        title: '我的八字命盘',
        subtitle: '根据出生日期与出生地生成的专属命理画像',
        accentText: '乙木日主 · 木旺 · 喜用水木',
        footerText: '知命而后，更懂自己',
        summary: '乙木日主，气质温和，内心有韧性',
        themeName: 'oriental-gold',
        eyebrowText: 'FORTUNE HUB SHARE POSTER',
        chips: ['乙木', '木旺', '喜用水木'],
        metrics: [],
        highlightLines: [],
        baziPoster: {
          tagText: '八字分享',
          calendarText: '1996年10月21日 09:28',
          birthPlace: '杭州',
          dayMaster: '乙木',
          pillars: [
            { label: '年柱', stem: '丙', branch: '子' },
            { label: '月柱', stem: '丁', branch: '酉' },
            { label: '日柱', stem: '乙', branch: '卯' },
            { label: '时柱', stem: '辛', branch: '巳' },
          ],
          wuxingTrend: '木旺',
          favorableElements: '水木',
          analysis: [
            '乙木日主，气质温和，内心有韧性',
            '木水相生，学习力与感受力较强',
            '火土偏弱，宜增强行动与执行节奏',
          ],
          fortunes: [
            { label: '综合运势', value: 82, color: '#2F7D5B' },
            { label: '事业', value: 84, color: '#4B8FA8' },
            { label: '感情', value: 88, color: '#D96B5F' },
          ],
          brandLabel: '八字运势',
          bottomSlogan: '知命而后，更懂自己',
        },
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
