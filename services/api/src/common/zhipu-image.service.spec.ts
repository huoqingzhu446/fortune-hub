import { ConfigService } from '@nestjs/config';
import { ZhipuImageService } from './zhipu-image.service';

describe('ZhipuImageService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts official glm-image payload and resolves returned image url', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'ZHIPU_API_KEY') {
          return 'test-key';
        }
        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new ZhipuImageService(config);
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            request_id: 'req-1',
            data: [{ url: 'https://example.test/generated.png' }],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from('png-bytes'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      );

    const result = await service.generateImage({
      prompt: 'soft fortune image',
      size: '1024x1024',
      purpose: '测试',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      model: 'glm-image',
      prompt: 'soft fortune image',
      size: '1024x1024',
    });
    expect(result.requestId).toBe('req-1');
    expect(result.providerImageUrl).toBe('https://example.test/generated.png');
    expect(result.imageDataUrl).toContain('data:image/png;base64,');
  });
});
