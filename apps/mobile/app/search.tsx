import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { MedicineMatch } from '@medinfo/shared';
import { useLanguage } from '../src/i18n/context';
import { searchMedicines } from '../src/api/client';

export default function SearchScreen() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicineMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await searchMedicines(q, lang);
      setResults(res.results);
    } finally {
      setBusy(false);
      setSearched(true);
    }
  };

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.input}
        placeholder={t.searchPlaceholder}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={run}
        returnKeyType="search"
        autoFocus
      />
      {busy ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(m) => m.medicine.id}
          ListEmptyComponent={searched ? <Text style={styles.empty}>{t.noResults}</Text> : null}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/medicine/${item.medicine.id}`)}>
              <Text style={styles.name}>{item.medicine.name}</Text>
              {item.medicine.genericName ? <Text style={styles.generic}>{item.medicine.genericName}</Text> : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 12, padding: 14, fontSize: 16 },
  empty: { color: '#888', marginTop: 24, textAlign: 'center' },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  name: { fontSize: 17, fontWeight: '600' },
  generic: { fontSize: 14, color: '#777', marginTop: 2 },
});
