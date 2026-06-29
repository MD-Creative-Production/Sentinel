import { ProfileApiError, UpdateProfileRequest, UserProfile } from '../types/profile';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function buildHeaders(userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? `Request failed with status ${response.status}`);
    throw new ProfileApiError(message, response.status);
  }

  return body as T;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'GET',
    headers: buildHeaders(userId),
  });

  return parseResponse<UserProfile>(response);
}

export async function updateProfile(
  userId: string,
  payload: UpdateProfileRequest,
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: buildHeaders(userId),
    body: JSON.stringify(payload),
  });

  return parseResponse<UserProfile>(response);
}
