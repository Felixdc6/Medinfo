import type { ExtractionResult } from '@medinfo/shared';

/**
 * A provider that reads a medicine-box photo and extracts the medicine identity.
 *
 * Implementations are interchangeable; the active one is chosen by the
 * VLM_PROVIDER env var (see ./index.ts). Qwen2-VL is the default (no API cost);
 * Claude is an optional paid swap-in. Adding an open-source model later means
 * adding one file here — callers depend only on this interface.
 */
export interface VlmProvider {
  readonly id: string;
  extractMedication(image: Buffer, mimeType: string): Promise<ExtractionResult>;
}

/** Instruction shared by all providers so extraction output is consistent. */
export const EXTRACTION_SYSTEM_PROMPT = [
  'You read photographs of medicine boxes (in Dutch, French, German or English).',
  'Extract the printed commercial name, the strength (e.g. "500 mg") and the',
  'pharmaceutical form (e.g. "tablet", "siroop") if visible.',
  'Return STRICT JSON: {"name": string, "strength": string|null, "form": string|null,',
  '"rawText": string, "confidence": number}. rawText is all legible text on the box.',
  'confidence is 0..1. Do not guess a name that is not printed on the box.',
].join(' ');
