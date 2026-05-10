import type { DivinationPosterData } from './types';

export const mockDivinationPosterData: DivinationPosterData = {
  title: '占卜结果',
  methodLabel: '综合占卜 · 略签分策法',

  result: {
    prefix: '本卦',
    name: '雷地豫',
    subtitle: '顺势动员',
    luckyLevel: '大吉',
    trigramNote: '震上 · 坤下',
    hexagramLines: [
      { type: 'broken' },
      { type: 'broken' },
      { type: 'solid', active: true },
      { type: 'broken' },
      { type: 'broken' },
      { type: 'broken' },
    ],
  },

  chips: [
    {
      icon: 'method',
      label: '起法',
      value: '略签分策法',
    },
    {
      icon: 'move',
      label: '动爻',
      value: '九四',
    },
    {
      icon: 'change',
      label: '变卦',
      value: '坤为地',
    },
  ],

  question: {
    tag: '高岛式断曰',
    text: '明天能加仓了吗',
    summary: '占得「雷地豫」。雷出地上，人心可动，宜鼓舞与预备。',
  },

  analysisCards: [
    {
      icon: 'lightning',
      title: '动爻',
      value: '九四',
      content:
        '九四为本次关键。爻辞曰「九四：由豫，大有得。勿疑，朋盍簪。」高岛断法以动爻为主，先审时度势，再定进退。',
      actionText: '宜观察回归，再决定是否加仓。',
    },
    {
      icon: 'earth',
      title: '变卦',
      value: '坤为地',
      content:
        '变为「坤为地」。宜把资源、人情和节奏先安顿好，以静制动，厚积而后发。',
      actionText: '宜观察回归，再决定是否加仓。',
    },
  ],

  footer: {
    slogan: '长按识别，生成你的今日占卜',
    brand: 'Fortune Hub',
  },
};
