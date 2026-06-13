import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SOURCES, type LeafletResponse, type LeafletSectionKey } from '@medinfo/shared';
import { useLanguage } from '../../src/i18n/context';
import { isRtl } from '../../src/i18n';
import { getLeaflet } from '../../src/api/client';
import { SectionCard } from '../../src/components/SectionCard';
import { ErrorRetry } from '../../src/components/ErrorRetry';

interface DisplaySection {
  key: LeafletSectionKey;
  title: string;
  readable: string;
  original: string;
}

export default function MedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [data, setData] = useState<LeafletResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    getLeaflet(id, lang)
      .then((d) => active && setData(d))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [id, lang, reload]);

  if (error) return <ErrorRetry message={t.notFound} onRetry={() => setReload((r) => r + 1)} />;
  if (!data) return <Centered><ActivityIndicator /></Centered>;

  const sections = buildSections(data);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: data.medicine.name }} />
      <Text style={styles.name}>{data.medicine.name}</Text>
      {data.medicine.genericName ? <Text style={styles.generic}>{data.medicine.genericName}</Text> : null}

      {sections.map((s) => (
        <SectionCard key={s.key} title={s.title} readable={s.readable} original={s.original} rtl={isRtl(lang)} />
      ))}

      <Pressable
        style={styles.ask}
        onPress={() => router.push(`/ask/${id}`)}
        accessibilityRole="button"
        accessibilityLabel={t.ask}
      >
        <Text style={styles.askText}>{t.ask}</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(data.leaflet.originalSourceUrl)}
        accessibilityRole="link"
        accessibilityLabel={t.viewSource}
        hitSlop={8}
      >
        <Text style={styles.source}>
          {t.viewSource}
          {data.leaflet.sourceLastUpdated ? ` · ${data.leaflet.sourceLastUpdated}` : ''}
        </Text>
      </Pressable>

      {/* Regulatory attribution: name the official source of the leaflet data. */}
      <Text style={styles.attrib}>
        FAMHP — {SOURCES.famhpDatabase.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </Text>
    </ScrollView>
  );
}

/** Merge source sections with the (optional) translation so each card shows the
 *  readable text in the user's language and the verbatim source original. */
function buildSections(data: LeafletResponse): DisplaySection[] {
  const bySource = new Map(data.leaflet.sections.map((s) => [s.key, s]));
  if (data.translation) {
    return data.translation.sections.map((ts) => ({
      key: ts.key,
      title: ts.title,
      readable: ts.reformattedText,
      original: bySource.get(ts.key)?.originalText ?? ts.reformattedText,
    }));
  }
  return data.leaflet.sections.map((s) => ({
    key: s.key,
    title: s.title,
    readable: s.reformattedText,
    original: s.originalText,
  }));
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '700' },
  generic: { fontSize: 16, color: '#777', marginBottom: 16 },
  error: { color: '#e33' },
  ask: { backgroundColor: '#0a6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  askText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  source: { color: '#0a6', textAlign: 'center', textDecorationLine: 'underline', marginBottom: 8 },
  attrib: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
