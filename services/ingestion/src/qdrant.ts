import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_COLLECTIONS } from '@medinfo/shared';
import { config } from './config.js';

export const qdrant = new QdrantClient({
  url: config.qdrantUrl,
  checkCompatibility: false,
  ...(config.qdrantApiKey ? { apiKey: config.qdrantApiKey } : {}),
});

/** Create the two collections if they don't exist, sized to the embedding model. */
export async function ensureCollections(dimensions: number): Promise<void> {
  for (const name of Object.values(QDRANT_COLLECTIONS)) {
    const exists = await qdrant.collectionExists(name);
    if (!exists.exists) {
      await qdrant.createCollection(name, {
        vectors: { size: dimensions, distance: 'Cosine' },
      });
      console.log(`[qdrant] created collection ${name} (dim=${dimensions})`);
    }
  }
}
