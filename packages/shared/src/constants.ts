/** Qdrant collection names. */
export const QDRANT_COLLECTIONS = {
  /** One point per medicine name/synonym, for semantic + fuzzy box matching. */
  medicineIndex: 'medicine_index',
  /** Chunked, reformatted leaflet text, for in-leaflet RAG ("ask the leaflet"). */
  leafletChunks: 'leaflet_chunks',
} as const;

/** Official Belgian sources (for attribution shown next to every leaflet). */
export const SOURCES = {
  famhpDatabase: 'https://medicinesdatabase.be/',
  samPortal: 'https://www.samportal.be/',
} as const;
