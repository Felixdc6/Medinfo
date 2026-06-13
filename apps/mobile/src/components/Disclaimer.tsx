import { StyleSheet, Text, View } from 'react-native';
import type { SupportedLanguage } from '@medinfo/shared';
import { getDisclaimer, isRtl } from '../i18n';

/**
 * Regulatory disclaimer, pinned to the bottom of the app on every screen.
 * Rendered by the app shell so it is always present, in the user's language.
 */
export function Disclaimer({ lang }: { lang: SupportedLanguage }) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <Text
        style={[styles.text, isRtl(lang) && styles.rtl]}
        // Always legible regardless of user font scaling, but cap to keep it on screen.
        maxFontSizeMultiplier={1.4}
      >
        {getDisclaimer(lang)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontSize: 11,
    lineHeight: 15,
    color: '#444444',
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
