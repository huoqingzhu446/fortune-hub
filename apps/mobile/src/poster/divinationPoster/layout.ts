import { posterTheme } from './posterTheme';

export function createPosterLayout() {
  const W = posterTheme.size.width;
  const H = posterTheme.size.height;
  const pageX = posterTheme.space.pageX;

  return {
    canvas: {
      x: 0,
      y: 0,
      w: W,
      h: H,
    },

    title: {
      x: 0,
      y: 72,
      w: W,
      h: 82,
    },

    heroCard: {
      x: pageX,
      y: 222,
      w: W - pageX * 2,
      h: 690,
    },

    questionCard: {
      x: pageX,
      y: 940,
      w: W - pageX * 2,
      h: 196,
    },

    leftAnalysisCard: {
      x: pageX,
      y: 1166,
      w: 400,
      h: 344,
    },

    rightAnalysisCard: {
      x: W - pageX - 400,
      y: 1166,
      w: 400,
      h: 344,
    },

    footer: {
      x: pageX,
      y: 1532,
      w: W - pageX * 2,
      h: 108,
    },

    qr: {
      x: W - pageX - 128,
      y: 1520,
      w: 128,
      h: 128,
    },
  };
}
