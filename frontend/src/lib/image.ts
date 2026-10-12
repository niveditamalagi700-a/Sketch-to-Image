export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

export function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d');
  if (!context) return true;

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  // Check if every pixel is either completely transparent or completely white
  // 0x00000000 is transparent, 0xFFFFFFFF is solid white (ABGR in little endian)
  for (let i = 0; i < pixelBuffer.length; i++) {
    const pixel = pixelBuffer[i];
    // If not white (0xFFFFFFFF) and has non-zero alpha
    if (pixel !== 0xFFFFFFFF && (pixel & 0xFF000000) !== 0) {
      return false;
    }
  }
  return true;
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid PNG, JPG, or WEBP image file.',
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 8MB limit. Current size is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width < 64 || height < 64) {
        resolve({
          valid: false,
          error: 'Image is too small. Minimum dimensions are 64x64 pixels.',
        });
      } else if (width > 4096 || height > 4096) {
        resolve({
          valid: false,
          error: 'Image is too large. Maximum dimensions are 4096x4096 pixels.',
        });
      } else {
        resolve({
          valid: true,
          width,
          height,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to read image data. The file may be corrupted.',
      });
    };

    img.src = objectUrl;
  });
}
