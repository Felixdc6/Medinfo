import type { LeafletSectionKey, SourceLanguage } from '@medinfo/shared';

export interface RawSection {
  key: LeafletSectionKey;
  ordinal: number;
  title: string;
  originalText: string;
}

/**
 * Belgian patient leaflets (PIL) follow a fixed 6-section template whose headings
 * are numbered 1.–6. The headings appear twice: once in a table of contents near
 * the top, then again as the real section headers. We therefore:
 *   - only treat a line as a heading if it STARTS with the expected section number,
 *     which excludes body cross-references ("zie rubriek 4", "déclarer les effets…");
 *   - match the heading text accent/apostrophe/case-insensitively, because the real
 *     FR headers are upper-cased and accent-stripped (e.g. "UTILISE", "CONNAITRE");
 *   - keep the LAST numbered occurrence of each section, i.e. the real header, not
 *     the table-of-contents entry.
 */
interface SectionSpec {
  number: number;
  key: LeafletSectionKey;
  /** Any of these normalized substrings identifies the heading. */
  anchors: string[];
}

const SPECS: Record<SourceLanguage, SectionSpec[]> = {
  nl: [
    { number: 1, key: 'what_is_it', anchors: ['waarvoor wordt', 'wat is'] },
    { number: 2, key: 'before_use', anchors: ['wanneer mag u'] },
    { number: 3, key: 'how_to_use', anchors: ['hoe neemt u', 'hoe gebruikt u', 'hoe moet u'] },
    { number: 4, key: 'side_effects', anchors: ['bijwerkingen'] },
    { number: 5, key: 'storage', anchors: ['hoe bewaart u', 'bewaart u'] },
    { number: 6, key: 'composition', anchors: ['inhoud van de verpakking'] },
  ],
  fr: [
    { number: 1, key: 'what_is_it', anchors: ['qu est ce que', 'quest ce que'] },
    { number: 2, key: 'before_use', anchors: ['informations'] },
    { number: 3, key: 'how_to_use', anchors: ['comment prendre', 'comment utiliser'] },
    { number: 4, key: 'side_effects', anchors: ['effets indesirables'] },
    { number: 5, key: 'storage', anchors: ['comment conserver'] },
    { number: 6, key: 'composition', anchors: ['contenu de l emballage'] },
  ],
};

/** Lowercase, strip diacritics, and reduce punctuation to single spaces. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const HEADING_LINE = /^\s*(\d{1,2})\s*[.)]\s*(.+)$/;

interface Candidate {
  key: LeafletSectionKey;
  title: string;
  headingStart: number;
  bodyStart: number;
}

export function segmentLeaflet(text: string, language: SourceLanguage): RawSection[] {
  const specs = SPECS[language];
  const lines = text.split(/\r?\n/);
  const byKey = new Map<LeafletSectionKey, Candidate>();

  let offset = 0;
  for (const line of lines) {
    const lineStart = offset;
    offset += line.length + 1; // +1 for the stripped newline
    const m = HEADING_LINE.exec(line);
    if (!m) continue;
    const number = Number(m[1]);
    const rest = m[2]!.trim();
    const normRest = normalize(rest);
    const spec = specs.find((s) => s.number === number && s.anchors.some((a) => normRest.includes(a)));
    if (!spec) continue;
    // Keep the last occurrence (real header beats the table of contents).
    byKey.set(spec.key, { key: spec.key, title: rest.replace(/\s+/g, ' '), headingStart: lineStart, bodyStart: offset });
  }

  const found = [...byKey.values()].sort((a, b) => a.headingStart - b.headingStart);
  return found.map((hit, i) => {
    const end = i + 1 < found.length ? found[i + 1]!.headingStart : text.length;
    return {
      key: hit.key,
      ordinal: i,
      title: hit.title,
      originalText: text.slice(hit.bodyStart, end).trim(),
    };
  });
}
