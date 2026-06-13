import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useLanguage } from '../src/i18n/context';
import { Disclaimer } from '../src/components/Disclaimer';

/**
 * Root layout. Wraps the whole navigator so the regulatory Disclaimer is pinned to
 * the bottom of every screen, in the user's selected language.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Shell />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { lang, t } = useLanguage();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerTitle: t.appTitle }}>
          <Stack.Screen name="index" options={{ title: t.appTitle }} />
          <Stack.Screen name="camera" options={{ title: t.scan }} />
          <Stack.Screen name="result" options={{ title: t.scan }} />
          <Stack.Screen name="search" options={{ title: t.search }} />
          <Stack.Screen name="settings" options={{ title: t.settings }} />
        </Stack>
      </View>
      <Disclaimer lang={lang} />
    </View>
  );
}
