import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'medinfo.deviceId';

/** RFC4122-ish v4 uuid. Sufficient for an anonymous, non-security device id. */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Stable anonymous device id, generated once and persisted. Used so the backend
 * can scope uploaded images to this device for deletion — no account required.
 */
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  const id = uuidv4();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
