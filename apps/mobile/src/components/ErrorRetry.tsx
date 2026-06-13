import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/context';

/** Friendly error state with a retry action, used on data-loading screens. */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.root}>
      <Text style={styles.msg}>{message}</Text>
      <Pressable
        style={styles.btn}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t.retake}
        hitSlop={8}
      >
        <Text style={styles.btnText}>{t.retake}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  msg: { fontSize: 16, color: '#555', textAlign: 'center' },
  btn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: '#0a6' },
  btnText: { fontSize: 16, color: '#0a6', fontWeight: '600' },
});
