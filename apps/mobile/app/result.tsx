import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MedicineMatch } from '@medinfo/shared';
import { useLanguage } from '../src/i18n/context';
import { getLastIdentify } from '../src/state/lastIdentify';

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const result = getLastIdentify();

  if (!result) {
    return <View style={styles.center}><Text>{t.noResults}</Text></View>;
  }

  const open = (m: MedicineMatch) => router.push(`/medicine/${m.medicine.id}`);

  return (
    <View style={styles.root}>
      <Text style={styles.read}>“{result.extraction.name || result.extraction.rawText}”</Text>
      {result.candidates.length === 0 ? (
        <Text style={styles.empty}>{t.noResults}</Text>
      ) : (
        <FlatList
          data={result.candidates}
          keyExtractor={(m) => m.medicine.id}
          ListHeaderComponent={<Text style={styles.section}>{t.alternatives}</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => open(item)}>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  read: { fontSize: 18, fontStyle: 'italic', color: '#444', marginBottom: 16 },
  section: { fontSize: 13, textTransform: 'uppercase', color: '#888', marginBottom: 8 },
  empty: { color: '#888' },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  name: { fontSize: 17, fontWeight: '600' },
  generic: { fontSize: 14, color: '#777', marginTop: 2 },
});
