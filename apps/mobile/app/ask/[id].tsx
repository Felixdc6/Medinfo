import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { AskResponse } from '@medinfo/shared';
import { useLanguage } from '../../src/i18n/context';
import { isRtl } from '../../src/i18n';
import { askLeaflet } from '../../src/api/client';

export default function AskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const rtl = isRtl(lang);

  const send = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      setAnswer(await askLeaflet(id, q, lang));
    } catch {
      setAnswer({ answer: t.notFound, citations: [], language: lang });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextInput
        style={[styles.input, rtl && styles.rtl]}
        placeholder={t.askPlaceholder}
        value={question}
        onChangeText={setQuestion}
        multiline
      />
      <Pressable style={styles.send} onPress={send} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>{t.send}</Text>}
      </Pressable>

      {answer && (
        <View style={styles.answerBox}>
          <Text style={[styles.answer, rtl && styles.rtl]}>{answer.answer}</Text>
          {answer.citations.length > 0 && (
            <Text style={styles.cites}>{answer.citations.map((c) => c.sectionKey).join(' · ')}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 12, padding: 14, fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  send: { backgroundColor: '#0a6', padding: 15, borderRadius: 12, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  answerBox: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', borderRadius: 12, padding: 14, backgroundColor: '#fafafa' },
  answer: { fontSize: 16, lineHeight: 23, color: '#222' },
  cites: { fontSize: 12, color: '#0a6', marginTop: 10 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
