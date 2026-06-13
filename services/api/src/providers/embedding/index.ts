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

export function createEmbeddingProvider(env = process.env): EmbeddingProvider {
  const id = env.EMBEDDING_PROVIDER ?? 'bge-m3';
  const client = new OpenAI({
    baseURL: env.EMBEDDING_BASE_URL ?? 'http://localhost:11434/v1',
    apiKey: env.EMBEDDING_API_KEY ?? 'not-needed',
  });
  // bge-m3 produces 1024-dim vectors.
  const dimensions = Number(env.EMBEDDING_DIMENSIONS ?? 1024);
  return new OpenAiCompatibleEmbeddingProvider(id, dimensions, client, env.EMBEDDING_MODEL ?? 'bge-m3');
}
