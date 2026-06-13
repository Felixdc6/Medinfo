import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { QdrantClient } from '@qdrant/js-client-rest';
import { createEmbeddingProvider, createTextProvider, createVlmProvider } from '@medinfo/providers';

/** Shared singletons for the API process. Providers connect lazily on first use. */
export const vlm = createVlmProvider();
export const embeddings = createEmbeddingProvider();
export const text = createTextProvider();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://medinfo:medinfo@localhost:5432/medinfo',
});

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? 'http://localhost:6333',
  checkCompatibility: false,
  ...(process.env.QDRANT_API_KEY ? { apiKey: process.env.QDRANT_API_KEY } : {}),
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(sql, params);
}

/** Where uploaded box images are stored on disk (deletable from Settings). */
export const IMAGE_DIR = resolve(process.env.IMAGE_DIR ?? './data/images');
mkdirSync(IMAGE_DIR, { recursive: true });

/** Hours to retain uploaded images. 0 = delete immediately after extraction. */
export const IMAGE_RETENTION_HOURS = Number(process.env.IMAGE_RETENTION_HOURS ?? 24);
