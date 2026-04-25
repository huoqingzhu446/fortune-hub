import type { ThemeKey } from './tokens';
import { DEFAULT_THEME_KEY } from './tokens';
import amberHoneySvg from '../static/illustrations/fortune-orbital/amber_honey.svg?raw';
import champagneGoldSvg from '../static/illustrations/fortune-orbital/champagne_gold.svg?raw';
import cloudGrayPurpleSvg from '../static/illustrations/fortune-orbital/cloud_gray_purple.svg?raw';
import jadeWhiteSvg from '../static/illustrations/fortune-orbital/jade_white.svg?raw';
import lavenderSvg from '../static/illustrations/fortune-orbital/lavender.svg?raw';
import milkApricotSvg from '../static/illustrations/fortune-orbital/milk_apricot.svg?raw';
import mintCyanSvg from '../static/illustrations/fortune-orbital/mint_cyan.svg?raw';
import mistBlueSvg from '../static/illustrations/fortune-orbital/mist_blue.svg?raw';
import moonSilverSvg from '../static/illustrations/fortune-orbital/moon_silver.svg?raw';
import peachOrangeSvg from '../static/illustrations/fortune-orbital/peach_orange.svg?raw';
import roseDustSvg from '../static/illustrations/fortune-orbital/rose_dust.svg?raw';
import sakuraPinkSvg from '../static/illustrations/fortune-orbital/sakura_pink.svg?raw';
import seaSaltSvg from '../static/illustrations/fortune-orbital/sea_salt.svg?raw';
import turquoiseSvg from '../static/illustrations/fortune-orbital/turquoise.svg?raw';

const fortuneOrbitalMarkupMap: Record<ThemeKey, string> = {
  mist_blue: mistBlueSvg,
  sakura_pink: sakuraPinkSvg,
  turquoise: turquoiseSvg,
  lavender: lavenderSvg,
  milk_apricot: milkApricotSvg,
  champagne_gold: champagneGoldSvg,
  moon_silver: moonSilverSvg,
  peach_orange: peachOrangeSvg,
  rose_dust: roseDustSvg,
  mint_cyan: mintCyanSvg,
  sea_salt: seaSaltSvg,
  jade_white: jadeWhiteSvg,
  amber_honey: amberHoneySvg,
  cloud_gray_purple: cloudGrayPurpleSvg,
};

const fortuneOrbitalDataUrlMap = Object.fromEntries(
  Object.entries(fortuneOrbitalMarkupMap).map(([key, markup]) => [
    key,
    `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`,
  ]),
) as Record<ThemeKey, string>;

export function getFortuneOrbitalDataUrl(themeKey: ThemeKey) {
  return fortuneOrbitalDataUrlMap[themeKey] || fortuneOrbitalDataUrlMap[DEFAULT_THEME_KEY];
}
