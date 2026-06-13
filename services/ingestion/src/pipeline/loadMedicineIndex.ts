import { randomUUID } from 'node:crypto';
import { QDRANT_COLLECTIONS } from '@medinfo/shared';
import { createEmbeddingProvider } from '@medinfo/providers';
import { config } from '../config.js';
import { query } from '../db.js';
import { ensureCollections, qdrant } from '../qdrant.js';
import { parseSamAmpFile } from '../sources/sam.js';
import type { ParsedMedicine } from '../sources/types.js';

/**
 * Step 1: parse the SAM AMP export, upsert the medicine index + leaflet links into
 * Postgres, and embed each medicine's name into Qdrant for box matching.
 */
export async function loadMedicineIndex(): Promise<void> {
  const embeddings = createEmbeddingProvider();
  await ensureCollections(embeddings.dimensions);

  const medicines = parseSamAmpFile(config.samAmpPath);
  console.log(`[medicines] parsed ${medicines.length} products from ${config.samAmpPath}`);

  const points: { id: string; vector: number[]; payload: Record<string, unknown> }[] = [];
  const indexTexts: { id: string; text: string }[] = [];

  for (const med of medicines) {
    const id = await upsertMedicine(med);
    for (const ref of med.leaflets) await upsertLeaflet(id, ref);
    indexTexts.push({ id, text: [med.name, med.genericName].filter(Boolean).join(' ') });
    points.push({ id, vector: [], payload: { medicineId: id, name: med.name, cnk: med.cnk ?? null, atc: med.atcCode ?? null } });
  }

  // Embed names in batches and attach vectors.
  for (let i = 0; i < indexTexts.length; i += 64) {
    const batch = indexTexts.slice(i, i + 64);
    const vectors = await embeddings.embed(batch.map((b) => b.text));
    batch.forEach((b, j) => {
      const point = points.find((p) => p.id === b.id)!;
      point.vector = vectors[j]!;
    });
  }

  if (points.length > 0) {
    await qdrant.upsert(QDRANT_COLLECTIONS.medicineIndex, { wait: true, points });
  }
  console.log(`[medicines] indexed ${points.length} medicines into Qdrant`);
}

async function upsertMedicine(med: ParsedMedicine): Promise<string> {
  const res = await query<{ id: string }>(
    `INSERT INTO medicines
       (id, source_amp_code, cnk, name, name_nl, name_fr, generic_name, strength, form, atc_code, auth_holder, prescription_only)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (source_amp_code) DO UPDATE SET
       cnk = EXCLUDED.cnk, name = EXCLUDED.name, name_nl = EXCLUDED.name_nl, name_fr = EXCLUDED.name_fr,
       generic_name = EXCLUDED.generic_name, strength = EXCLUDED.strength, form = EXCLUDED.form,
       atc_code = EXCLUDED.atc_code, auth_holder = EXCLUDED.auth_holder,
       prescription_only = EXCLUDED.prescription_only, updated_at = now()
     RETURNING id`,
    [
      randomUUID(), med.ampCode, med.cnk ?? null, med.name, med.nameNl ?? null, med.nameFr ?? null,
      med.genericName ?? null, med.strength ?? null, med.form ?? null, med.atcCode ?? null,
      med.authHolder ?? null, med.prescriptionOnly ?? null,
    ],
  );
  return res.rows[0]!.id;
}

async function upsertLeaflet(medicineId: string, ref: { language: string; documentType: string; url: string }): Promise<void> {
  await query(
    `INSERT INTO leaflets (id, medicine_id, document_type, source_language, original_source_url)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (medicine_id, document_type, source_language)
     DO UPDATE SET original_source_url = EXCLUDED.original_source_url`,
    [randomUUID(), medicineId, ref.documentType, ref.language, ref.url],
  );
}
