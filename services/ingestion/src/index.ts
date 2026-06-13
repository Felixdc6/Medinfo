/**
 * Ingestion pipeline (Phase 1).
 *
 * Steps (each idempotent and resumable):
 *   1. SAM XML export  -> parse the medicine index (name, generic, strength, form,
 *      ATC, CNK) -> upsert into Postgres + embed names into Qdrant `medicine_index`.
 *      Source: https://www.samportal.be/  (open XML export)
 *   2. FAMHP medicinesdatabase.be -> for each authorised product, fetch the PIL
 *      (and SPC) document and record originalSourceUrl.
 *      Source: https://medicinesdatabase.be/
 *   3. Parse each leaflet PDF -> map headings onto canonical LeafletSection keys
 *      -> reformat each section for readability (REFORMAT_PROVIDER) while keeping
 *      the verbatim originalText and a page anchor back to the source.
 *   4. Chunk reformatted sections -> embed -> Qdrant `leaflet_chunks` for in-leaflet
 *      RAG. Translations (de/en/ar/tr) are generated lazily by the API and cached.
 *
 * This file is the orchestrator entrypoint; each step lives in its own module
 * (added in Phase 1). For now it documents the contract and exits.
 */
async function main(): Promise<void> {
  const step = process.argv[2] ?? 'all';
  console.log(`[ingestion] requested step: ${step}`);
  console.log('[ingestion] Phase 1 not yet implemented — see module docstring for the pipeline.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
