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

/** Extract text from a PDF buffer. pdfjs-dist is imported lazily so offline,
 *  fixture-only runs don't need it loaded. */
async function extractPdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return pages.join('\n');
}
