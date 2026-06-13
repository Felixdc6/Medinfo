import { randomUUID } from 'node:crypto';
import {
  type Leaflet,
  type LeafletDocumentType,
  type LeafletSection,
  type LeafletSectionKey,
  type LeafletTranslation,
  type SourceLanguage,
  type SupportedLanguage,
} from '@medinfo/shared';
import { query, text } from '../context.js';

interface LeafletRow {
  id: string;
  document_type: LeafletDocumentType;
  source_language: SourceLanguage;
  original_source_url: string;
  source_last_updated: Date | null;
}
interface SectionRow {
  section_key: LeafletSectionKey;
  title: string;
  original_text: string;
  reformatted_text: string;
  source_page: number | null;
}

export interface LeafletResult {
  leaflet: Leaflet;
  translation?: LeafletTranslation;
}

/** Fetch a medicine's patient leaflet, translating on demand (and caching) when
 *  the requested language differs from the leaflet's source language. */
export async function getLeaflet(medicineId: string, lang: SupportedLanguage): Promise<LeafletResult | null> {
  const lrow = (
    await query<LeafletRow>(
      `SELECT id, document_type, source_language, original_source_url, source_last_updated
         FROM leaflets
        WHERE medicine_id = $1 AND document_type = 'pil'
        ORDER BY (source_language = $2) DESC, (source_language = 'nl') DESC
        LIMIT 1`,
      [medicineId, lang],
    )
  ).rows[0];
  if (!lrow) return null;

  const sections = (
    await query<SectionRow>(
      `SELECT section_key, title, original_text, reformatted_text, source_page
         FROM leaflet_sections WHERE leaflet_id = $1 ORDER BY ordinal`,
      [lrow.id],
    )
  ).rows;

  const leaflet: Leaflet = {
    id: lrow.id,
    medicineId,
    documentType: lrow.document_type,
    sourceLanguage: lrow.source_language,
    originalSourceUrl: lrow.original_source_url,
    ...(lrow.source_last_updated ? { sourceLastUpdated: lrow.source_last_updated.toISOString().slice(0, 10) } : {}),
    sections: sections.map(
      (s): LeafletSection => ({
        key: s.section_key,
        title: s.title,
        originalText: s.original_text,
        reformattedText: s.reformatted_text,
        ...(s.source_page !== null ? { sourceAnchor: { page: s.source_page } } : {}),
      }),
    ),
  };

  if (lang === lrow.source_language) return { leaflet };
  return { leaflet, translation: await getOrCreateTranslation(leaflet, lang) };
}

async function getOrCreateTranslation(leaflet: Leaflet, lang: SupportedLanguage): Promise<LeafletTranslation> {
  const cached = (
    await query<{ sections: LeafletTranslation['sections']; generated_at: Date }>(
      'SELECT sections, generated_at FROM leaflet_translations WHERE leaflet_id = $1 AND language = $2',
      [leaflet.id, lang],
    )
  ).rows[0];
  if (cached) {
    return { leafletId: leaflet.id, language: lang, sections: cached.sections, generatedAt: cached.generated_at.toISOString() };
  }

  const sections = await Promise.all(
    leaflet.sections.map(async (s) => {
      const t = await translateSection(s.title, s.reformattedText, leaflet.sourceLanguage, lang);
      return { key: s.key, title: t.title, reformattedText: t.text };
    }),
  );

  await query(
    `INSERT INTO leaflet_translations (id, leaflet_id, language, sections)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (leaflet_id, language) DO UPDATE SET sections = EXCLUDED.sections, generated_at = now()`,
    [randomUUID(), leaflet.id, lang, JSON.stringify(sections)],
  );
  return { leafletId: leaflet.id, language: lang, sections, generatedAt: new Date().toISOString() };
}

const LANG_NAMES: Record<SupportedLanguage, string> = {
  nl: 'Dutch', fr: 'French', de: 'German', en: 'English', ar: 'Arabic', tr: 'Turkish',
};

async function translateSection(
  title: string,
  body: string,
  from: SourceLanguage,
  to: SupportedLanguage,
): Promise<{ title: string; text: string }> {
  const system = [
    `Translate patient medicine-leaflet text from ${LANG_NAMES[from]} to ${LANG_NAMES[to]}.`,
    'Preserve the meaning exactly. Do NOT add, remove, soften or invent any medical information,',
    'dose, or warning. Return STRICT JSON: {"title": string, "text": string}.',
  ].join(' ');
  try {
    const raw = await text.complete({ system, prompt: JSON.stringify({ title, text: body }), json: true, maxTokens: 2000 });
    const parsed = JSON.parse(raw) as { title?: string; text?: string };
    return { title: parsed.title?.trim() || title, text: parsed.text?.trim() || body };
  } catch {
    // On any failure, fall back to the untranslated source rather than blocking.
    return { title, text: body };
  }
}
