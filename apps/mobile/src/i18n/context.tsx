import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupportedLanguage, type SupportedLanguage } from '@medinfo/shared';
import { UI_STRINGS, detectLanguage, type UIStrings } from './index';

const KEY = 'medinfo.language';

interface LanguageContextValue {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: UIStrings;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>(detectLanguage());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => {
      if (saved && isSupportedLanguage(saved)) setLangState(saved);
    });
  }, []);

  const setLang = (next: SupportedLanguage) => {
    setLangState(next);
    void AsyncStorage.setItem(KEY, next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: UI_STRINGS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
