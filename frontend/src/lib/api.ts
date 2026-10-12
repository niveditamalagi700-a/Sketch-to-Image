export type StylePreset =
  | 'photorealistic'
  | 'digital_art'
  | 'watercolor'
  | 'anime'
  | '3d_render'
  | 'pencil_realistic'
  | 'ui_mockup';

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

export interface GenerateRequest {
  sketch: Blob | File;
  prompt: string;
  style: StylePreset;
  strength?: number;
  seed?: number;
  aspect_ratio: AspectRatio;
}

export interface RegenerateRequest extends GenerateRequest {
  previous_request_id?: string;
}

export interface GenerateResponse {
  request_id: string;
  image_url?: string | null;
  image_base64?: string | null;
  mime_type: string;
  seed: number;
  style: StylePreset;
  elapsed_ms: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sketch-to-image-o2ee.onrender.com';

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    if (data && data.error && data.error.message) {
      throw new ApiError(data.error.message, data.error.code || 'API_ERROR', res.status);
    }
    if (res.status === 429) {
      throw new ApiError('Too many generation requests. Please wait a moment before trying again.', 'RATE_LIMIT_EXCEEDED', 429);
    }
    if (res.status >= 500) {
      throw new ApiError('AI generation service error. Please retry in a few moments.', 'SERVER_ERROR', res.status);
    }
    throw new ApiError(`Request failed with status ${res.status}`, 'HTTP_ERROR', res.status);
  }

  return data as T;
}

function buildFormData(params: GenerateRequest & { previous_request_id?: string }): FormData {
  const formData = new FormData();
  formData.append('sketch', params.sketch, 'sketch.png');
  formData.append('prompt', params.prompt);
  formData.append('style', params.style);
  formData.append('aspect_ratio', params.aspect_ratio);

  if (params.strength !== undefined && params.strength !== null) {
    formData.append('strength', params.strength.toString());
  }
  if (params.seed !== undefined && params.seed !== null) {
    formData.append('seed', params.seed.toString());
  }
  if (params.previous_request_id) {
    formData.append('previous_request_id', params.previous_request_id);
  }

  return formData;
}

export async function generateImage(
  params: GenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const formData = buildFormData(params);
  try {
    const res = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      body: formData,
      signal,
    });
    return await parseResponse<GenerateResponse>(res);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('Generation request was cancelled.', 'CANCELLED', 0);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('Unable to connect to the backend server. Please verify your connection.', 'NETWORK_ERROR', 0);
  }
}

export async function regenerateImage(
  params: RegenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const formData = buildFormData(params);
  try {
    const res = await fetch(`${API_BASE_URL}/regenerate`, {
      method: 'POST',
      body: formData,
      signal,
    });
    return await parseResponse<GenerateResponse>(res);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('Regeneration request was cancelled.', 'CANCELLED', 0);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('Unable to connect to the backend server. Please verify your connection.', 'NETWORK_ERROR', 0);
  }
}

export async function checkHealth(signal?: AbortSignal): Promise<{ status: string; timestamp: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal });
    return await parseResponse<{ status: string; timestamp: string }>(res);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Health check failed', 'NETWORK_ERROR', 0);
  }
}
