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

export interface UIStrings {
  appTitle: string;
  scan: string;
  scanHint: string;
  search: string;
  searchPlaceholder: string;
  settings: string;
  language: string;
  deleteImages: string;
  deleteImagesDone: string;
  original: string;
  readable: string;
  ask: string;
  askPlaceholder: string;
  send: string;
  viewSource: string;
  alternatives: string;
  noResults: string;
  notFound: string;
  loading: string;
  retake: string;
  usePhoto: string;
  allowCamera: string;
}

export const UI_STRINGS: Record<SupportedLanguage, UIStrings> = {
  nl: {
    appTitle: 'Medinfo', scan: 'Scan een doosje', scanHint: 'Richt op de naam op de verpakking',
    search: 'Zoeken', searchPlaceholder: 'Naam van geneesmiddel', settings: 'Instellingen',
    language: 'Taal', deleteImages: 'Geüploade foto’s verwijderen', deleteImagesDone: 'Foto’s verwijderd',
    original: 'Origineel', readable: 'Leesbaar', ask: 'Stel een vraag', askPlaceholder: 'Stel een vraag over dit geneesmiddel',
    send: 'Versturen', viewSource: 'Originele bijsluiter', alternatives: 'Andere mogelijkheden',
    noResults: 'Geen resultaten', notFound: 'Niet gevonden', loading: 'Laden…', retake: 'Opnieuw', usePhoto: 'Gebruik foto',
    allowCamera: 'Camera toestaan',
  },
  fr: {
    appTitle: 'Medinfo', scan: 'Scanner une boîte', scanHint: 'Visez le nom sur l’emballage',
    search: 'Rechercher', searchPlaceholder: 'Nom du médicament', settings: 'Paramètres',
    language: 'Langue', deleteImages: 'Supprimer les photos envoyées', deleteImagesDone: 'Photos supprimées',
    original: 'Original', readable: 'Lisible', ask: 'Poser une question', askPlaceholder: 'Posez une question sur ce médicament',
    send: 'Envoyer', viewSource: 'Notice originale', alternatives: 'Autres possibilités',
    noResults: 'Aucun résultat', notFound: 'Introuvable', loading: 'Chargement…', retake: 'Reprendre', usePhoto: 'Utiliser la photo',
    allowCamera: 'Autoriser la caméra',
  },
  de: {
    appTitle: 'Medinfo', scan: 'Packung scannen', scanHint: 'Richten Sie auf den Namen auf der Packung',
    search: 'Suchen', searchPlaceholder: 'Name des Arzneimittels', settings: 'Einstellungen',
    language: 'Sprache', deleteImages: 'Hochgeladene Fotos löschen', deleteImagesDone: 'Fotos gelöscht',
    original: 'Original', readable: 'Lesbar', ask: 'Frage stellen', askPlaceholder: 'Stellen Sie eine Frage zu diesem Arzneimittel',
    send: 'Senden', viewSource: 'Originaler Beipackzettel', alternatives: 'Andere Möglichkeiten',
    noResults: 'Keine Ergebnisse', notFound: 'Nicht gefunden', loading: 'Laden…', retake: 'Erneut', usePhoto: 'Foto verwenden',
    allowCamera: 'Kamera erlauben',
  },
  en: {
    appTitle: 'Medinfo', scan: 'Scan a box', scanHint: 'Point at the name on the package',
    search: 'Search', searchPlaceholder: 'Medicine name', settings: 'Settings',
    language: 'Language', deleteImages: 'Delete uploaded photos', deleteImagesDone: 'Photos deleted',
    original: 'Original', readable: 'Readable', ask: 'Ask a question', askPlaceholder: 'Ask a question about this medicine',
    send: 'Send', viewSource: 'Original leaflet', alternatives: 'Other matches',
    noResults: 'No results', notFound: 'Not found', loading: 'Loading…', retake: 'Retake', usePhoto: 'Use photo',
    allowCamera: 'Allow camera',
  },
  ar: {
    appTitle: 'Medinfo', scan: 'امسح العلبة', scanHint: 'وجّه الكاميرا نحو الاسم على العبوة',
    search: 'بحث', searchPlaceholder: 'اسم الدواء', settings: 'الإعدادات',
    language: 'اللغة', deleteImages: 'حذف الصور المرفوعة', deleteImagesDone: 'تم حذف الصور',
    original: 'الأصلي', readable: 'مبسّط', ask: 'اطرح سؤالاً', askPlaceholder: 'اطرح سؤالاً عن هذا الدواء',
    send: 'إرسال', viewSource: 'النشرة الأصلية', alternatives: 'احتمالات أخرى',
    noResults: 'لا نتائج', notFound: 'غير موجود', loading: 'جارٍ التحميل…', retake: 'إعادة', usePhoto: 'استخدم الصورة',
    allowCamera: 'السماح بالكاميرا',
  },
  tr: {
    appTitle: 'Medinfo', scan: 'Kutuyu tara', scanHint: 'Ambalajdaki ismi hedefleyin',
    search: 'Ara', searchPlaceholder: 'İlaç adı', settings: 'Ayarlar',
    language: 'Dil', deleteImages: 'Yüklenen fotoğrafları sil', deleteImagesDone: 'Fotoğraflar silindi',
    original: 'Orijinal', readable: 'Okunur', ask: 'Soru sor', askPlaceholder: 'Bu ilaç hakkında bir soru sorun',
    send: 'Gönder', viewSource: 'Orijinal prospektüs', alternatives: 'Diğer eşleşmeler',
    noResults: 'Sonuç yok', notFound: 'Bulunamadı', loading: 'Yükleniyor…', retake: 'Yeniden', usePhoto: 'Fotoğrafı kullan',
    allowCamera: 'Kameraya izin ver',
  },
};
