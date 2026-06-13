import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { SupportedLanguage } from '@medinfo/shared';
import { Disclaimer } from './src/components/Disclaimer';
import { detectLanguage, UI_STRINGS } from './src/i18n';

/**
 * App shell. The screen content lives in the flexible top area; the regulatory
 * Disclaimer is always pinned to the bottom. (Navigation/screens land in Phase 3.)
 */
export default function App() {
  const [lang] = useState<SupportedLanguage>(detectLanguage());
  const t = UI_STRINGS[lang];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Medinfo</Text>
        <Text style={styles.subtitle}>{t.scan}</Text>
      </View>
      <Disclaimer lang={lang} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#666666' },
});
