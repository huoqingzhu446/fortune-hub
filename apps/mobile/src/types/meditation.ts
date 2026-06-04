export interface MeditationMusicItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'sleep' | 'breath' | 'focus' | 'healing' | 'meditation' | 'body';
  categoryLabel: string;
  durationMinutes: number;
  atmosphere: string;
  scene: string;
  guide: string[];
  tags: string[];
  previewUrl: string;
}
