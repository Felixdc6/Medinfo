import type { LeafletSectionKey, SourceLanguage } from '@medinfo/shared';

export interface RawSection {
  key: LeafletSectionKey;
  ordinal: number;
  title: string;
  originalText: string;
}

/**
 * Belgian patient leaflets (PIL) follow a fixed 6-heading template. We locate
 * those headings (numbered, in NL or FR) and slice the text between them, mapping
 * each onto a canonical section key. Anything before heading 1 is dropped (cover
 * boilerplate); unmatched tails fall into `other`.
 */
const HEADINGS: Record<SourceLanguage, { key: LeafletSectionKey; pattern: RegExp }[]> = {
  nl: [
    { key: 'what_is_it', pattern: /wat is .+ en waarvoor wordt het gebruikt/i },
    { key: 'before_use', pattern: /wanneer mag u .+ niet (innemen|gebruiken)|voorzichtig/i },
    { key: 'how_to_use', pattern: /hoe (gebruikt|neemt) u .+/i },
    { key: 'side_effects', pattern: /mogelijke bijwerkingen/i },
    { key: 'storage', pattern: /hoe bewaart u .+/i },
    { key: 'composition', pattern: /inhoud van de verpakking en overige informatie/i },
  ],
  fr: [
    { key: 'what_is_it', pattern: /qu.?est-ce que .+ et dans quels cas est-il utilis/i },
    { key: 'before_use', pattern: /informations? .+ avant (de prendre|d.utiliser)/i },
    { key: 'how_to_use', pattern: /comment (prendre|utiliser) .+/i },
    { key: 'side_effects', pattern: /effets? ind.sirables/i },
    { key: 'storage', pattern: /comment conserver .+/i },
    { key: 'composition', pattern: /contenu de l.emballage et autres informations/i },
  ],
};

interface HeadingHit {
  key: LeafletSectionKey;
  title: string;
  start: number;
  bodyStart: number;
}

export function segmentLeaflet(text: string, language: SourceLanguage): RawSection[] {
  const lines = text.split(/\r?\n/);
  const specs = HEADINGS[language];
  const hits: HeadingHit[] = [];

  let offset = 0;
  for (const line of lines) {
    const lineStart = offset;
    offset += line.length + 1; // +1 for the newline
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spec = specs.find((s) => s.pattern.test(trimmed));
    // Only treat as a heading if not already captured and it looks like a heading
    // (short-ish line, optionally numbered "1." / "1)").
    if (spec && !hits.some((h) => h.key === spec.key) && trimmed.length < 120) {
      hits.push({ key: spec.key, title: trimmed.replace(/^\s*\d+[.)]\s*/, ''), start: lineStart, bodyStart: offset });
    }
  }

  hits.sort((a, b) => a.start - b.start);
  return hits.map((hit, i) => {
    const end = i + 1 < hits.length ? hits[i + 1]!.start : text.length;
    return {
      key: hit.key,
      ordinal: i,
      title: hit.title,
      originalText: text.slice(hit.bodyStart, end).trim(),
    };
  });
}
