import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../src/i18n/context';

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{t.scanHint}</Text>
      <Pressable
        style={[styles.btn, styles.primary]}
        onPress={() => router.push('/camera')}
        accessibilityRole="button"
        accessibilityLabel={t.scan}
      >
        <Text style={styles.primaryText}>{t.scan}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel={t.search}>
        <Text style={styles.btnText}>{t.search}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel={t.settings}>
        <Text style={styles.btnText}>{t.settings}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 14, justifyContent: 'center' },
  hint: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 12 },
  btn: { padding: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', alignItems: 'center' },
  btnText: { fontSize: 17 },
  primary: { backgroundColor: '#0a6', borderColor: '#0a6' },
  primaryText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
