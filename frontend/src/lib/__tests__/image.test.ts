import { describe, it, expect } from 'vitest';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, validateImageFile } from '../image';

describe('Image Utility Functions', () => {
  it('defines correct allowed mime types and maximum upload limit', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
    expect(MAX_UPLOAD_BYTES).toBe(8 * 1024 * 1024);
  });

  it('rejects unsupported MIME types during client validation', async () => {
    const fakeFile = new File(['plain text'], 'sketch.txt', { type: 'text/plain' });
    const result = await validateImageFile(fakeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Please upload a valid PNG, JPG, or WEBP');
  });

  it('rejects oversized files exceeding 8MB', async () => {
    // 9 MB mock file
    const oversizedBytes = new Uint8Array(9 * 1024 * 1024);
    const bigFile = new File([oversizedBytes], 'large_sketch.png', { type: 'image/png' });
    const result = await validateImageFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds the 8MB limit');
  });
});
