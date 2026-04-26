import { BadGatewayException } from '@nestjs/common';
import { PostersService } from './posters.service';

function buildService(imageGenerationService: {
  isConfigured: () => boolean;
  generate?: jest.Mock;
}) {
  return new PostersService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    imageGenerationService as never,
    {} as never,
  );
}

describe('PostersService', () => {
  it('fails poster background generation when Zhipu is not configured', async () => {
    const service = buildService({
      isConfigured: () => false,
    });

    await expect(
      (
        service as unknown as {
          resolvePosterBackground: (prompt: string, size: string) => Promise<unknown>;
        }
      ).resolvePosterBackground('poster prompt', '1088x1472'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('does not silently return builtin poster background when Zhipu fails', async () => {
    const service = buildService({
      isConfigured: () => true,
      generate: jest.fn().mockRejectedValue(new Error('provider unavailable')),
    });

    await expect(
      (
        service as unknown as {
          resolvePosterBackground: (prompt: string, size: string) => Promise<unknown>;
        }
      ).resolvePosterBackground('poster prompt', '1088x1472'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
