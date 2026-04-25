import {
  buildPublicApiFileContentUrl,
  extractFileIdFromFileUrl,
  normalizeFileServiceUrlToApiProxy,
} from './file-url.util';

describe('file-url util', () => {
  it('extracts file id from file-service content url', () => {
    expect(
      extractFileIdFromFileUrl(
        'http://localhost:3000/api/files/d8c14bb1-d78d-450c-8026-09bd386695b8/content',
      ),
    ).toBe('d8c14bb1-d78d-450c-8026-09bd386695b8');
  });

  it('builds public api proxy url', () => {
    expect(
      buildPublicApiFileContentUrl(
        'abc-123',
        'https://fortune.example.com/api/v1',
      ),
    ).toBe('https://fortune.example.com/api/v1/files/abc-123/content');
  });

  it('rewrites internal file-service url to api proxy', () => {
    expect(
      normalizeFileServiceUrlToApiProxy(
        'http://localhost:3000/api/files/abc-123/content',
        {
          internalBaseUrl: 'http://localhost:3000/api',
          publicApiBaseUrl: 'https://fortune.example.com/api/v1',
        },
      ),
    ).toBe('https://fortune.example.com/api/v1/files/abc-123/content');
  });

  it('keeps external urls unchanged', () => {
    expect(
      normalizeFileServiceUrlToApiProxy(
        'https://cdn.example.com/audio/demo.mp3',
        {
          internalBaseUrl: 'http://localhost:3000/api',
          publicApiBaseUrl: 'https://fortune.example.com/api/v1',
        },
      ),
    ).toBe('https://cdn.example.com/audio/demo.mp3');
  });
});
