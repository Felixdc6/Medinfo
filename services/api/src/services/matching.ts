import { QDRANT_COLLECTIONS, type MedicineMatch } from '@medinfo/shared';
import { embeddings, qdrant } from '../context.js';
import { findByName, getMedicinesByIds } from './medicines.js';

/**
 * Rank medicines for a query (a box name from extraction, or a search term) by
 * fusing three signals: exact name (1.0), fuzzy name contains (0.65), and
 * semantic similarity from the Qdrant medicine index (the cosine score). The best
 * score per medicine wins; results are sorted descending.
 */
export async function matchMedicine(query: string, limit = 5): Promise<MedicineMatch[]> {
  const q = query.trim();
  if (!q) return [];

  const best = new Map<string, MedicineMatch>();
  const consider = (m: MedicineMatch) => {
    const prev = best.get(m.medicine.id);
    if (!prev || m.score > prev.score) best.set(m.medicine.id, m);
  };

  // 1 + 2: exact / fuzzy from Postgres.
  for (const { medicine, exact } of await findByName(q)) {
    consider({ medicine, score: exact ? 1 : 0.65, matchType: exact ? 'exact' : 'fuzzy' });
  }

  // 3: semantic from Qdrant.
  try {
    const [vector] = await embeddings.embed([q]);
    if (vector) {
      const hits = await qdrant.search(QDRANT_COLLECTIONS.medicineIndex, { vector, limit, with_payload: true });
      const ids = hits.map((h) => String((h.payload?.medicineId as string) ?? h.id));
      const medicines = await getMedicinesByIds(ids);
      for (const hit of hits) {
        const id = String((hit.payload?.medicineId as string) ?? hit.id);
        const medicine = medicines.get(id);
        if (medicine) consider({ medicine, score: hit.score, matchType: 'semantic' });
      }
    }
  } catch (err) {
    // Semantic search is best-effort; name matches still work if Qdrant is down.
    console.warn('[matching] semantic search failed:', (err as Error).message);
  }

  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
