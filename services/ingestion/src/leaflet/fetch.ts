import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import type { SourceLanguage } from '@medinfo/shared';

/**
 * Resolve a leaflet's raw text. Prefers an offline fixture (`<amp>_<lang>.txt`
 * in LEAFLET_FIXTURE_DIR) when configured; otherwise downloads the PDF and
 * extracts its text. Returns null if neither is available.
 */
export async function fetchLeafletText(
  ampCode: string,
  language: SourceLanguage,
  url: string,
): Promise<string | null> {
  if (config.leafletFixtureDir) {
    const path = resolve(config.leafletFixtureDir, `${ampCode}_${language}.txt`);
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[leaflet] ${url} -> HTTP ${res.status}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return await extractPdfText(buf);
  } catch (err) {
    console.warn(`[leaflet] failed to fetch ${url}: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Extract text from a PDF buffer. pdfjs-dist is imported lazily so offline,
 * fixture-only runs don't need it loaded.
 *
 * FAMHP leaflets are justified/letter-spaced: pdfjs returns one item per glyph
 * cluster, with real spaces as explicit " " items. We therefore concatenate the
 * raw `str` values and insert a space/newline only from geometry (horizontal gap
 * / vertical change), instead of forcing a space between every item — which would
 * shatter words into "N O T I C E".
 */
export async function extractPdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(reconstructPageText(content.items));
  }
  return normalizeWhitespace(pages.join('\n\n'));
}

interface TextItemLike {
  str: string;
  width?: number;
  height?: number;
  transform?: number[];
  hasEOL?: boolean;
}

function reconstructPageText(items: unknown[]): string {
  let out = '';
  let prevEndX: number | null = null;
  let prevY: number | null = null;

  for (const raw of items) {
    const it = raw as TextItemLike;
    if (typeof it.str !== 'string') continue;
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;
    const w = it.width ?? 0;
    const lineHeight = it.height ?? 10;

    if (prevY !== null && Math.abs(y - prevY) > lineHeight * 0.5) {
      out += '\n'; // new line
    } else if (prevEndX !== null && it.str && x - prevEndX > 1.5 && !out.endsWith(' ')) {
      out += ' '; // gap wide enough to be a missing space
    }
    out += it.str;
    prevEndX = x + w;
    prevY = y;
    if (it.hasEOL) out += '\n';
  }
  return out;
}

/** Collapse runaway spaces and blank lines that survive reconstruction. */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
