import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ZhipuImagePayload = {
  created?: number;
  data?: Array<{
    url?: string;
    b64_json?: string;
    base64?: string;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
  code?: string | number;
  message?: string;
  request_id?: string;
};

export type GeneratedImageAsset = {
  provider: 'zhipu';
  model: string;
  status: 'generated';
  prompt: string;
  size: string;
  providerImageUrl: string | null;
  imageDataUrl: string;
  imageBuffer: Buffer;
  mimeType: string;
  requestId: string | null;
  raw: Record<string, unknown>;
};

export type GenerateImageInput = {
  prompt: string;
  size: string;
  purpose: string;
};

@Injectable()
export class ZhipuImageService {
  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.getApiKey());
  }

  async generateImage(input: GenerateImageInput): Promise<GeneratedImageAsset> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new BadGatewayException('未配置 ZHIPU_API_KEY，无法调用智谱生图');
    }

    const model = this.configService.get<string>('ZHIPU_IMAGE_MODEL', 'glm-image');
    const response = await this.fetchWithTimeout(
      this.configService.get<string>(
        'ZHIPU_IMAGE_ENDPOINT',
        'https://open.bigmodel.cn/api/paas/v4/images/generations',
      ),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: input.prompt.slice(0, 1000),
          size: input.size,
        }),
      },
      this.readPositiveInt('ZHIPU_IMAGE_TIMEOUT_MS', 75_000),
      `智谱${input.purpose}生图响应超时`,
    );

    const payload = await this.readJson(response);
    const image = payload.data?.[0];

    if (!response.ok || !image) {
      throw new BadGatewayException(this.resolveZhipuErrorMessage(payload));
    }

    const resolved = await this.resolveImage(image);

    return {
      provider: 'zhipu',
      model,
      status: 'generated',
      prompt: input.prompt,
      size: input.size,
      providerImageUrl: image.url ?? null,
      imageDataUrl: resolved.imageDataUrl,
      imageBuffer: resolved.imageBuffer,
      mimeType: resolved.mimeType,
      requestId: payload.request_id ?? null,
      raw: {
        created: payload.created ?? null,
        requestId: payload.request_id ?? null,
        url: image.url ?? null,
      },
    };
  }

  private getApiKey() {
    return (
      this.configService.get<string>('ZHIPU_API_KEY') ??
      this.configService.get<string>('BIGMODEL_API_KEY') ??
      ''
    ).trim();
  }

  private async resolveImage(image: {
    url?: string;
    b64_json?: string;
    base64?: string;
  }) {
    const inlineBase64 = image.b64_json ?? image.base64;

    if (inlineBase64) {
      const imageBuffer = Buffer.from(inlineBase64, 'base64');
      return {
        imageDataUrl: `data:image/png;base64,${inlineBase64}`,
        imageBuffer,
        mimeType: 'image/png',
      };
    }

    if (!image.url) {
      throw new BadGatewayException('智谱返回的图片地址为空');
    }

    const response = await this.fetchWithTimeout(
      image.url,
      undefined,
      this.readPositiveInt('ZHIPU_IMAGE_FETCH_TIMEOUT_MS', 15_000),
      '智谱生成图片下载超时',
    );

    if (!response.ok) {
      throw new BadGatewayException(`智谱生成图片下载失败：HTTP ${response.status}`);
    }

    const mimeType = response.headers.get('content-type') || 'image/png';
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    return {
      imageDataUrl: `data:${mimeType};base64,${imageBuffer.toString('base64')}`,
      imageBuffer,
      mimeType,
    };
  }

  private async readJson(response: Response): Promise<ZhipuImagePayload> {
    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text) as ZhipuImagePayload;
    } catch {
      return {
        message: text.slice(0, 500),
      };
    }
  }

  private resolveZhipuErrorMessage(payload: ZhipuImagePayload) {
    return (
      payload.error?.message ||
      payload.message ||
      (payload.code ? `智谱生图失败：${payload.code}` : '') ||
      '智谱生图失败，请检查 ZHIPU_API_KEY、模型名和图片尺寸配置'
    );
  }

  private readPositiveInt(key: string, fallback: number) {
    const value = Number(this.configService.get<string>(key, String(fallback)));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private async fetchWithTimeout(
    input: string,
    init: RequestInit | undefined,
    timeoutMs: number,
    timeoutMessage: string,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...(init ?? {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException(timeoutMessage);
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
