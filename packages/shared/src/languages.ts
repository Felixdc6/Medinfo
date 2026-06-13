/**
 * Languages the app supports.
 *
 * Belgium's official leaflet languages are Dutch (nl) and French (fr); German (de)
 * is the third national language. We additionally support English (en), Arabic (ar)
 * and Turkish (tr) for large communities in Belgium. Leaflet *content* is authored
 * in nl/fr; ar/tr/de/en are produced by on-demand translation of the reformatted text.
 */
export const SUPPORTED_LANGUAGES = ['nl', 'fr', 'de', 'en', 'ar', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Languages an official Belgian leaflet is natively published in. */
export const SOURCE_LANGUAGES = ['nl', 'fr'] as const;
export type SourceLanguage = (typeof SOURCE_LANGUAGES)[number];

/** Right-to-left languages (affects layout in the app). */
export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  nl: 'Nederlands',
  fr: 'Français',
  de: 'Deutsch',
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
