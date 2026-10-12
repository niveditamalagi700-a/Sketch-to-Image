import { describe, it, expect, vi } from 'vitest';
import { ApiError, generateImage } from '../api';

describe('Frontend API Client', () => {
  it('instantiates ApiError with message, code, and status', () => {
    const err = new ApiError('Sketch format invalid', 'INVALID_IMAGE', 400);
    expect(err.message).toBe('Sketch format invalid');
    expect(err.code).toBe('INVALID_IMAGE');
    expect(err.status).toBe(400);
  });

  it('handles successful generation response', async () => {
    const mockResponse = {
      request_id: 'req_test123',
      image_url: 'https://example.com/result.png',
      image_base64: null,
      mime_type: 'image/png',
      seed: 42,
      style: 'photorealistic',
      elapsed_ms: 850,
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockResponse,
    } as any);

    try {
      const blob = new Blob(['fake image bytes'], { type: 'image/png' });
      const result = await generateImage({
        sketch: blob,
        prompt: 'A scenic mountain landscape',
        style: 'photorealistic',
        aspect_ratio: '1:1',
        strength: 0.7,
      });

      expect(result.request_id).toBe('req_test123');
      expect(result.image_url).toBe('https://example.com/result.png');
      expect(result.seed).toBe(42);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws mapped ApiError when backend returns error payload', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({
        error: { code: 'VALIDATION_ERROR', message: 'Prompt too short' },
      }),
    } as any);

    try {
      const blob = new Blob(['fake image bytes'], { type: 'image/png' });
      await expect(
        generateImage({
          sketch: blob,
          prompt: 'a',
          style: 'watercolor',
          aspect_ratio: '1:1',
        })
      ).rejects.toThrow('Prompt too short');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
