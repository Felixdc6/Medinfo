import { getLocales } from 'expo-localization';
import {
  DISCLAIMER,
  RTL_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@medinfo/shared';

/** Pick the best supported language from the device locale, defaulting to nl. */
export function detectLanguage(): SupportedLanguage {
  for (const locale of getLocales()) {
    const code = locale.languageCode?.toLowerCase() ?? '';
    if (isSupportedLanguage(code)) return code;
  }
  return 'nl';
}

export function getDisclaimer(lang: SupportedLanguage): string {
  return DISCLAIMER[lang];
}

export function isRtl(lang: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}

/** Minimal UI string table; expanded as screens are built (Phase 3). */
export const UI_STRINGS: Record<SupportedLanguage, { scan: string; settings: string; deleteImages: string }> = {
  nl: { scan: 'Scan een doosje', settings: 'Instellingen', deleteImages: 'Geüploade foto’s verwijderen' },
  fr: { scan: 'Scanner une boîte', settings: 'Paramètres', deleteImages: 'Supprimer les photos envoyées' },
  de: { scan: 'Packung scannen', settings: 'Einstellungen', deleteImages: 'Hochgeladene Fotos löschen' },
  en: { scan: 'Scan a box', settings: 'Settings', deleteImages: 'Delete uploaded photos' },
  ar: { scan: 'امسح العلبة', settings: 'الإعدادات', deleteImages: 'حذف الصور المرفوعة' },
  tr: { scan: 'Kutuyu tara', settings: 'Ayarlar', deleteImages: 'Yüklenen fotoğrafları sil' },
};
