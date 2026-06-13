import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/i18n/context';
import { identify } from '../src/api/client';
import { setLastIdentify } from '../src/state/lastIdentify';

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>{t.scanHint}</Text>
        <Pressable style={styles.shutter} onPress={requestPermission}>
          <Text style={styles.shutterLabel}>{t.allowCamera}</Text>
        </Pressable>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (!photo?.uri) throw new Error('no_photo');
      const result = await identify(photo.uri);
      setLastIdentify(result);
      router.replace('/result');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.preview} />
      <View style={styles.overlay}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.shutter} onPress={capture} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.shutterLabel}>{t.usePhoto}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  preview: { flex: 1 },
  overlay: { padding: 20, alignItems: 'center', backgroundColor: '#000' },
  shutter: { backgroundColor: '#0a6', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, minWidth: 180, alignItems: 'center' },
  shutterLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 16, color: '#666', textAlign: 'center' },
  error: { color: '#e33', marginBottom: 10, textAlign: 'center' },
});
