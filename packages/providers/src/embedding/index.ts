import { createHash } from 'node:crypto';
import OpenAI from 'openai';

/**
 * Multilingual text embeddings (NL/FR/DE/EN/AR/TR). Default model is bge-m3,
 * served behind an OpenAI-compatible endpoint — strong cross-lingual retrieval,
 * which matters because a user may search in Turkish against Dutch leaflet text.
 * Swappable like the VLM provider.
 */
export interface EmbeddingProvider {
  readonly id: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
  constructor(
    readonly id: string,
    readonly dimensions: number,
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({ model: this.model, input: texts });
    return res.data.map((d) => d.embedding);
  }
}

/**
 * Deterministic, dependency-free embeddings for offline development and tests.
 * NOT semantically meaningful — it only lets the full ingestion + retrieval
 * pipeline run without a model server. Select with EMBEDDING_PROVIDER=hash.
 */
export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'hash';
  constructor(readonly dimensions: number = 1024) {}

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((t) => this.vector(t)));
  }

  private vector(text: string): number[] {
    const out = new Array<number>(this.dimensions).fill(0);
    for (const token of text.toLowerCase().split(/\s+/).filter(Boolean)) {
      const digest = createHash('sha256').update(token).digest();
      for (let i = 0; i < this.dimensions; i++) {
        // map each dim to a byte of the digest; +/- 1 contribution
        const byte = digest[i % digest.length]!;
        out[i]! += (byte & 1 ? 1 : -1) * ((byte >> 1) / 128);
      }
    }
    const norm = Math.hypot(...out) || 1;
    return out.map((v) => v / norm);
  }
}

export function createEmbeddingProvider(env = process.env): EmbeddingProvider {
  const id = (env.EMBEDDING_PROVIDER ?? 'bge-m3').toLowerCase();
  const dimensions = Number(env.EMBEDDING_DIMENSIONS ?? 1024);
  if (id === 'hash') return new HashEmbeddingProvider(dimensions);

  const client = new OpenAI({
    baseURL: env.EMBEDDING_BASE_URL ?? 'http://localhost:11434/v1',
    apiKey: env.EMBEDDING_API_KEY ?? 'not-needed',
  });
  return new OpenAiCompatibleEmbeddingProvider(id, dimensions, client, env.EMBEDDING_MODEL ?? 'bge-m3');
}
