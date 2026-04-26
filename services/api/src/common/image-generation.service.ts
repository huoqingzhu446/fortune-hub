import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeneratedImageAsset,
  GenerateImageInput,
  ZhipuImageService,
} from './zhipu-image.service';

export type ImageGenerationPurpose =
  | '海报背景'
  | '幸运壁纸背景'
  | '诊断';

export type ImageGenerationInput = Omit<GenerateImageInput, 'purpose'> & {
  purpose: ImageGenerationPurpose;
};

const GLM_IMAGE_DEFAULT_SIZES = {
  posterSquare: '1280x1280',
  posterPortrait: '1088x1472',
  wallpaperPortrait: '1088x1472',
  wallpaperLandscape: '1472x1088',
  wallpaperSquare: '1280x1280',
  diagnostic: '1024x1024',
} as const;

const GLM_IMAGE_SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '960x1280',
  '1088x1440',
  '1088x1472',
  '1440x1088',
  '1472x1088',
  '1280x960',
  '1152x864',
  '1344x768',
  '1280x1280',
] as const;

@Injectable()
export class ImageGenerationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly zhipuImageService: ZhipuImageService,
  ) {}

  isConfigured() {
    return this.zhipuImageService.isConfigured();
  }

  async generate(input: ImageGenerationInput): Promise<GeneratedImageAsset> {
    return this.zhipuImageService.generateImage(input);
  }

  getDiagnosticStatus() {
    const model = this.configService.get<string>('ZHIPU_IMAGE_MODEL', 'glm-image');

    return {
      configured: this.isConfigured(),
      configuredKeyEnv: this.resolveConfiguredKeyEnv(),
      provider: 'zhipu',
      model,
      endpoint: this.configService.get<string>(
        'ZHIPU_IMAGE_ENDPOINT',
        'https://open.bigmodel.cn/api/paas/v4/images/generations',
      ),
      modelEnv: 'ZHIPU_IMAGE_MODEL',
      endpointEnv: 'ZHIPU_IMAGE_ENDPOINT',
      apiKeyEnv: 'ZHIPU_API_KEY',
      fallbackApiKeyEnv: 'BIGMODEL_API_KEY',
      timeoutEnv: 'ZHIPU_IMAGE_TIMEOUT_MS',
      fetchTimeoutEnv: 'ZHIPU_IMAGE_FETCH_TIMEOUT_MS',
      timeoutMs: this.readPositiveInt('ZHIPU_IMAGE_TIMEOUT_MS', 75_000),
      fetchTimeoutMs: this.readPositiveInt('ZHIPU_IMAGE_FETCH_TIMEOUT_MS', 15_000),
      defaultSizes: this.getDefaultSizes(),
      supportedSizes: [...GLM_IMAGE_SUPPORTED_SIZES],
    };
  }

  getDefaultSizes() {
    return {
      ...GLM_IMAGE_DEFAULT_SIZES,
      wallpaperPortrait: this.configService.get<string>(
        'ZHIPU_WALLPAPER_SIZE_9_16',
        GLM_IMAGE_DEFAULT_SIZES.wallpaperPortrait,
      ),
      wallpaperLandscape: this.configService.get<string>(
        'ZHIPU_WALLPAPER_SIZE_16_9',
        GLM_IMAGE_DEFAULT_SIZES.wallpaperLandscape,
      ),
      wallpaperSquare: this.configService.get<string>(
        'ZHIPU_WALLPAPER_SIZE_1_1',
        GLM_IMAGE_DEFAULT_SIZES.wallpaperSquare,
      ),
    };
  }

  getWallpaperSize(aspectRatio: '9:16' | '16:9' | '1:1') {
    const sizes = this.getDefaultSizes();

    if (aspectRatio === '16:9') {
      return sizes.wallpaperLandscape;
    }

    if (aspectRatio === '1:1') {
      return sizes.wallpaperSquare;
    }

    return sizes.wallpaperPortrait;
  }

  private resolveConfiguredKeyEnv() {
    if (this.configService.get<string>('ZHIPU_API_KEY')?.trim()) {
      return 'ZHIPU_API_KEY';
    }

    if (this.configService.get<string>('BIGMODEL_API_KEY')?.trim()) {
      return 'BIGMODEL_API_KEY';
    }

    return null;
  }

  private readPositiveInt(key: string, fallback: number) {
    const value = Number(this.configService.get<string>(key, String(fallback)));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
