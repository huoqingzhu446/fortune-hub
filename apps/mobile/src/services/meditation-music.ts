import type { MeditationMusicItem } from '../types/lucky';

export const meditationMusicLibrary: MeditationMusicItem[] = [
  {
    id: 'moon-breath',
    title: '月光呼吸',
    subtitle: '适合睡前放松，呼吸节奏更慢一点。',
    category: 'sleep',
    durationMinutes: 12,
    atmosphere: '柔和白噪',
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
  },
  {
    id: 'forest-focus',
    title: '林间专注',
    subtitle: '适合工作前整理心绪，安静进入状态。',
    category: 'focus',
    durationMinutes: 10,
    atmosphere: '自然环境音',
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
  },
  {
    id: 'tidal-reset',
    title: '潮汐复位',
    subtitle: '适合情绪起伏后，重新稳定身体节奏。',
    category: 'healing',
    durationMinutes: 8,
    atmosphere: '海浪与低频铺底',
    previewUrl: 'https://actions.google.com/sounds/v1/water/dripping_water.ogg',
  },
  {
    id: 'silent-count',
    title: '静数呼吸',
    subtitle: '适合短时间呼吸练习，轻量不打扰。',
    category: 'breath',
    durationMinutes: 5,
    atmosphere: '极简提示音',
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/woodland_night.ogg',
  },
];

export function findMeditationMusic(id?: string) {
  if (!id) {
    return null;
  }

  return meditationMusicLibrary.find((item) => item.id === id) ?? null;
}
