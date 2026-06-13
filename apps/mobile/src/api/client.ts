import type {
  AskResponse,
  IdentifyResponse,
  LeafletResponse,
  SearchResponse,
  SupportedLanguage,
} from '@medinfo/shared';
import { getDeviceId } from './device';

/** Base URL of the Medinfo API. Set EXPO_PUBLIC_API_URL for device/simulator. */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

/** Upload a captured box photo and identify the medicine. */
export async function identify(imageUri: string): Promise<IdentifyResponse> {
  const deviceId = await getDeviceId();
  const form = new FormData();
  // React Native FormData accepts a file descriptor object.
  form.append('image', { uri: imageUri, name: 'box.jpg', type: 'image/jpeg' } as unknown as Blob);
  return json<IdentifyResponse>('/identify', {
    method: 'POST',
    headers: { 'x-device-id': deviceId },
    body: form,
  });
}

export function searchMedicines(query: string, lang: SupportedLanguage): Promise<SearchResponse> {
  return json<SearchResponse>(`/medicines/search?q=${encodeURIComponent(query)}&lang=${lang}`);
}

export function getLeaflet(medicineId: string, lang: SupportedLanguage): Promise<LeafletResponse> {
  return json<LeafletResponse>(`/medicines/${medicineId}/leaflet?lang=${lang}`);
}

export function askLeaflet(medicineId: string, question: string, lang: SupportedLanguage): Promise<AskResponse> {
  return json<AskResponse>(`/medicines/${medicineId}/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, lang }),
  });
}

/** Delete all of this device's uploaded photos (Settings). */
export async function deleteUploadedImages(): Promise<{ deleted: number }> {
  const deviceId = await getDeviceId();
  return json<{ deleted: number }>(`/images?deviceId=${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
}
