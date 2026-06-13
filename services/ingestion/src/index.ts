/**
 * Ingestion orchestrator (Phase 1).
 *
 * Usage:  pnpm ingest [step]
 *   migrate    apply DB migrations only
 *   medicines  step 1: SAM index -> Postgres + Qdrant
 *   leaflets   step 2: leaflet docs -> reformatted sections + chunk embeddings
 *   all        (default) migrate -> medicines -> leaflets
 *
 * Offline: set EMBEDDING_PROVIDER=hash and LEAFLET_FIXTURE_DIR=./fixtures/leaflets
 * to run the whole pipeline against the bundled sample without any model server
 * or network access (still needs Postgres + Qdrant from `pnpm infra:up`).
 */
import { runMigrations, pool } from './db.js';
import { loadMedicineIndex } from './pipeline/loadMedicineIndex.js';
import { loadLeaflets } from './pipeline/loadLeaflets.js';

async function main(): Promise<void> {
  const step = (process.argv[2] ?? 'all').toLowerCase();
  console.log(`[ingestion] step: ${step}`);

  if (step === 'migrate' || step === 'all') await runMigrations();
  if (step === 'medicines' || step === 'all') await loadMedicineIndex();
  if (step === 'leaflets' || step === 'all') await loadLeaflets();

  console.log('[ingestion] done');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
