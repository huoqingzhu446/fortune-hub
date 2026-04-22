import type { LuckyWallpaperTheme } from '../types/lucky';

const LUCKY_WALLPAPER_THEME_KEY = 'fortune-hub-lucky-wallpaper-theme';

export function setLuckyWallpaperTheme(theme: LuckyWallpaperTheme) {
  uni.setStorageSync(LUCKY_WALLPAPER_THEME_KEY, theme);
}

export function getLuckyWallpaperTheme() {
  return (uni.getStorageSync(LUCKY_WALLPAPER_THEME_KEY) as LuckyWallpaperTheme | null) ?? null;
}

export function clearLuckyWallpaperTheme() {
  uni.removeStorageSync(LUCKY_WALLPAPER_THEME_KEY);
}
