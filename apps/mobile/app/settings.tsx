import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@medinfo/shared';
import { useLanguage } from '../src/i18n/context';
import { deleteUploadedImages } from '../src/api/client';

export default function SettingsScreen() {
  const { lang, setLang, t } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteUploadedImages();
      Alert.alert(t.deleteImagesDone);
    } catch (e) {
      Alert.alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{t.language}</Text>
      {SUPPORTED_LANGUAGES.map((code: SupportedLanguage) => (
        <Pressable key={code} style={styles.row} onPress={() => setLang(code)}>
          <Text style={styles.lang}>{LANGUAGE_LABELS[code]}</Text>
          {code === lang ? <Text style={styles.check}>✓</Text> : null}
        </Pressable>
      ))}

      <Pressable style={styles.delete} onPress={onDelete} disabled={deleting}>
        <Text style={styles.deleteText}>{t.deleteImages}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  heading: { fontSize: 13, textTransform: 'uppercase', color: '#888', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  lang: { fontSize: 17 },
  check: { fontSize: 18, color: '#0a6', fontWeight: '700' },
  delete: { marginTop: 32, padding: 15, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e33', alignItems: 'center' },
  deleteText: { color: '#e33', fontSize: 16, fontWeight: '600' },
});
