import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult } from '@medinfo/shared';
import { EXTRACTION_SYSTEM_PROMPT, type VlmProvider } from './types.js';
import { parseExtraction } from './qwen.js';

/**
 * Optional paid provider: Claude vision. Used only when VLM_PROVIDER=claude.
 * Kept as a drop-in alternative to Qwen2-VL for higher accuracy when desired.
 */
export class ClaudeVlmProvider implements VlmProvider {
  readonly id = 'claude';
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(opts: { apiKey: string; model: string }) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model;
  }

  async extractMedication(image: Buffer, mimeType: string): Promise<ExtractionResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png',
                data: image.toString('base64'),
              },
            },
            { type: 'text', text: 'Extract the medicine from this box. Respond with JSON only.' },
          ],
        },
      ],
    });
    const text = message.content.find((b) => b.type === 'text');
    return parseExtraction(text && 'text' in text ? text.text : '{}', this.id);
  }
}
