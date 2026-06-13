import OpenAI from 'openai';
import type { ExtractionResult } from '@medinfo/shared';
import { EXTRACTION_SYSTEM_PROMPT, type VlmProvider } from './types.js';

/**
 * Default provider: Qwen2-VL served behind an OpenAI-compatible endpoint
 * (vLLM, Ollama, etc.). No per-call API cost when self-hosted.
 */
export class QwenVlmProvider implements VlmProvider {
  readonly id = 'qwen';
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(opts: { baseURL: string; apiKey?: string; model: string }) {
    this.client = new OpenAI({ baseURL: opts.baseURL, apiKey: opts.apiKey ?? 'not-needed' });
    this.model = opts.model;
  }

  async extractMedication(image: Buffer, mimeType: string): Promise<ExtractionResult> {
    const dataUrl = `data:${mimeType};base64,${image.toString('base64')}`;
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the medicine from this box.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message.content ?? '{}';
    return parseExtraction(raw, this.id);
  }
}

export function parseExtraction(raw: string, provider: string): ExtractionResult {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Model returned non-JSON; treat the whole thing as rawText, low confidence.
    return { name: '', rawText: raw, confidence: 0, provider };
  }
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;
  return {
    name: str(parsed.name) ?? '',
    ...(str(parsed.strength) ? { strength: str(parsed.strength)! } : {}),
    ...(str(parsed.form) ? { form: str(parsed.form)! } : {}),
    rawText: str(parsed.rawText) ?? '',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    provider,
  };
}
