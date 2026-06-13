import { randomUUID } from 'node:crypto';
import { QDRANT_COLLECTIONS, type SourceLanguage } from '@medinfo/shared';
import { createEmbeddingProvider, createTextProvider } from '@medinfo/providers';
import { query } from '../db.js';
import { ensureCollections, qdrant } from '../qdrant.js';
import { fetchLeafletText } from '../leaflet/fetch.js';
import { segmentLeaflet } from '../leaflet/segment.js';
import { reformatSection } from '../leaflet/reformat.js';

interface LeafletRow {
  leaflet_id: string;
  medicine_id: string;
  amp_code: string;
  source_language: SourceLanguage;
  original_source_url: string;
}

/**
 * Step 2: for each unprocessed patient leaflet, fetch the source text, segment it
 * into canonical sections, reformat each for readability (keeping the verbatim
 * original), store the sections, and embed chunks into Qdrant for in-leaflet RAG.
 * SPC (professional) documents are kept as links only — not reformatted here.
 */
export async function loadLeaflets(limit = 1000): Promise<void> {
  const embeddings = createEmbeddingProvider();
  const text = createTextProvider();
  await ensureCollections(embeddings.dimensions);

  const rows = (
    await query<LeafletRow>(
      `SELECT l.id AS leaflet_id, l.medicine_id, m.source_amp_code AS amp_code,
              l.source_language, l.original_source_url
         FROM leaflets l
         JOIN medicines m ON m.id = l.medicine_id
        WHERE l.document_type = 'pil' AND l.processed_at IS NULL
        LIMIT $1`,
      [limit],
    )
  ).rows;

  console.log(`[leaflets] ${rows.length} patient leaflets to process`);

  for (const row of rows) {
    const raw = await fetchLeafletText(row.amp_code, row.source_language, row.original_source_url);
    if (!raw) {
      console.warn(`[leaflets] no text for ${row.amp_code} (${row.source_language}); skipping`);
      continue;
    }

    const sections = segmentLeaflet(raw, row.source_language);
    if (sections.length === 0) {
      console.warn(`[leaflets] no sections detected for ${row.amp_code} (${row.source_language})`);
      continue;
    }

    await query('DELETE FROM leaflet_sections WHERE leaflet_id = $1', [row.leaflet_id]);
    const chunkTexts: { id: string; text: string; sectionKey: string }[] = [];

    for (const section of sections) {
      const reformatted = await reformatSection(text, section, row.source_language);
      await query(
        `INSERT INTO leaflet_sections (id, leaflet_id, section_key, ordinal, title, original_text, reformatted_text)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [randomUUID(), row.leaflet_id, section.key, section.ordinal, section.title, section.originalText, reformatted],
      );
      for (const part of chunkText(reformatted)) {
        chunkTexts.push({ id: randomUUID(), text: part, sectionKey: section.key });
      }
    }

    // Re-index this leaflet's chunks (idempotent: clear then insert).
    await qdrant.delete(QDRANT_COLLECTIONS.leafletChunks, {
      wait: true,
      filter: { must: [{ key: 'leafletId', match: { value: row.leaflet_id } }] },
    });
    if (chunkTexts.length > 0) {
      const vectors = await embeddings.embed(chunkTexts.map((c) => c.text));
      await qdrant.upsert(QDRANT_COLLECTIONS.leafletChunks, {
        wait: true,
        points: chunkTexts.map((c, i) => ({
          id: c.id,
          vector: vectors[i]!,
          payload: {
            leafletId: row.leaflet_id,
            medicineId: row.medicine_id,
            sectionKey: c.sectionKey,
            language: row.source_language,
            text: c.text,
          },
        })),
      });
    }

    await query('UPDATE leaflets SET processed_at = now() WHERE id = $1', [row.leaflet_id]);
    console.log(`[leaflets] processed ${row.amp_code} (${row.source_language}): ${sections.length} sections`);
  }
}

/** Split text into ~600-char chunks on sentence boundaries for embedding. */
function chunkText(text: string, target = 600): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > target && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += `${s} `;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
