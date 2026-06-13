import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LeafletResponse } from '@medinfo/shared';

/**
 * Tiny offline cache for viewed leaflets, so a medicine opened once is readable
 * without connectivity (important for a reference app used at a pharmacy counter
 * or with poor signal). Keyed by medicine id + language.
 */
const key = (medicineId: string, lang: string) => `medinfo.leaflet.${medicineId}.${lang}`;

export async function cacheLeaflet(medicineId: string, lang: string, data: LeafletResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(key(medicineId, lang), JSON.stringify(data));
  } catch {
    // Caching is best-effort; never block the UI on a storage failure.
  }
}

export async function readCachedLeaflet(medicineId: string, lang: string): Promise<LeafletResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(key(medicineId, lang));
    return raw ? (JSON.parse(raw) as LeafletResponse) : null;
  } catch {
    return null;
  }
}
