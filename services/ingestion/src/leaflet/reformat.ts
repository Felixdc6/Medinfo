import type { TextProvider } from '@medinfo/providers';
import type { SourceLanguage } from '@medinfo/shared';
import type { RawSection } from './segment.js';

/**
 * Reformat one leaflet section into clear, plain language WITHOUT changing meaning,
 * adding advice, or translating (translation happens later, on demand). Falls back
 * to the original text if the model output is empty.
 */
export async function reformatSection(
  text: TextProvider,
  section: RawSection,
  language: SourceLanguage,
): Promise<string> {
  const langName = language === 'nl' ? 'Dutch' : 'French';
  const system = [
    `You improve the readability of official medicine leaflet text. Keep the SAME language (${langName}).`,
    'Rewrite into short sentences and bullet points where helpful. Use simple, everyday words.',
    'Do NOT add, remove, soften, or invent any medical information, dose, or warning.',
    'Do NOT add advice that is not in the source. Output only the rewritten text, no preamble.',
  ].join(' ');

  try {
    const out = (await text.complete({ system, prompt: section.originalText, maxTokens: 1500 })).trim();
    return out || section.originalText;
  } catch (err) {
    // If the text model is unreachable, keep the verbatim text so ingestion still
    // completes (e.g. offline runs). Readability reformatting can be re-run later.
    console.warn(`[reformat] falling back to original text: ${(err as Error).message}`);
    return section.originalText;
  }
}
