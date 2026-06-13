import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/context';

/**
 * One leaflet section: shows the readable (reformatted/translated) text by default,
 * collapsible, with a toggle to reveal the verbatim original — so users can always
 * compare against the official source.
 */
export function SectionCard({
  title,
  readable,
  original,
  rtl,
}: {
  title: string;
  readable: string;
  original: string;
  rtl: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const align = rtl ? styles.rtl : undefined;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Text style={[styles.title, align]}>{title}</Text>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open && (
        <View>
          <Text style={[styles.body, align]}>{showOriginal ? original : readable}</Text>
          {original !== readable && (
            <Pressable onPress={() => setShowOriginal((v) => !v)}>
              <Text style={styles.toggle}>{showOriginal ? t.readable : t.original}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', flex: 1 },
  chevron: { fontSize: 22, color: '#888', paddingLeft: 12 },
  body: { fontSize: 15, lineHeight: 22, color: '#222', marginTop: 10 },
  toggle: { fontSize: 13, color: '#0a6', marginTop: 10, fontWeight: '600' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
