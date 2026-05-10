export const posterTheme = {
  size: {
    width: 941,
    height: 1672,
  },

  color: {
    bgTop: '#F8F0E5',
    bgMiddle: '#F7EDE0',
    bgBottom: '#EFE3D3',

    card: 'rgba(255, 253, 248, 0.94)',
    cardSoft: 'rgba(255, 250, 246, 0.9)',
    questionCard: 'rgba(255, 253, 250, 0.92)',
    chipFill: 'rgba(255,255,255,0.62)',
    white: '#FFFFFF',

    textPrimary: '#3F3028',
    textSecondary: '#7B6B60',
    textMuted: '#A39387',
    hexagram: '#3F3448',

    purple: '#8D75F4',
    purpleSoft: '#EFE9FF',
    purplePale: 'rgba(141,117,244,0.18)',
    purpleGlow: 'rgba(141,117,244,0.08)',
    purpleDeep: '#5F47B8',
    tagGradientEnd: '#BFA8FF',
    bambooStroke: 'rgba(141,117,244,0.16)',
    bambooFill: 'rgba(141,117,244,0.12)',

    gold: '#D8A94D',
    goldSoft: '#FFF2D8',
    goldText: '#B67A1A',
    goldGlow: 'rgba(216,169,77,0.10)',
    border: 'rgba(216, 169, 77, 0.32)',
    borderLight: 'rgba(255,255,255,0.75)',
    badgeRing: 'rgba(216, 169, 77, 0.45)',
    chipBorder: 'rgba(216,169,77,0.18)',
    divider: 'rgba(216,169,77,0.32)',
    topArc: 'rgba(216, 169, 77, 0.24)',
    topRay: 'rgba(216, 169, 77, 0.13)',

    shadow: 'rgba(86, 61, 36, 0.12)',
    shadowSoft: 'rgba(86,61,36,0.04)',
    shadowQr: 'rgba(86,61,36,0.14)',
    glowWhite: 'rgba(255,255,255,0.38)',

    qrPlaceholder: '#FBF5EB',
    qrDot: '#3F3028',
  },

  radius: {
    xl: 36,
    lg: 28,
    md: 20,
    sm: 14,
    xs: 10,
  },

  shadow: {
    hero: {
      color: 'rgba(86, 61, 36, 0.12)',
      blur: 30,
      offsetY: 14,
    },
    card: {
      color: 'rgba(86, 61, 36, 0.12)',
      blur: 22,
      offsetY: 10,
    },
    chip: {
      color: 'rgba(86,61,36,0.04)',
      blur: 10,
      offsetY: 4,
    },
    qr: {
      color: 'rgba(86,61,36,0.14)',
      blur: 16,
      offsetY: 6,
    },
  },

  space: {
    pageX: 56,
    gap: 28,
  },

  font: {
    serif: 'STSong, Songti SC, Noto Serif SC, serif',
    sans: 'PingFang SC, Microsoft YaHei, Noto Sans SC, system-ui, sans-serif',
  },
} as const;

export type PosterTheme = typeof posterTheme;
