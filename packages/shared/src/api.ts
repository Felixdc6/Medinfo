import type { Leaflet, LeafletTranslation, Medicine } from './domain.js';
import type { SupportedLanguage } from './languages.js';

/** Result of running a VLM over a medicine-box photo. */
export interface ExtractionResult {
  name: string;
  strength?: string;
  form?: string;
  /** Raw text the model read off the box (useful for fuzzy matching). */
  rawText: string;
  /** 0..1 model-reported confidence. */
  confidence: number;
  /** Which provider produced this (e.g. "qwen", "claude"). */
  provider: string;
}

export type MatchType = 'exact' | 'fuzzy' | 'semantic';

export interface MedicineMatch {
  medicine: Medicine;
  /** 0..1 relevance score. */
  score: number;
  matchType: MatchType;
}

/** POST /identify  (multipart: image) -> identify a box and find its leaflet. */
export interface IdentifyResponse {
  imageId: string;
  extraction: ExtractionResult;
  best?: MedicineMatch;
  candidates: MedicineMatch[];
}

/** GET /medicines/search?q=&lang= */
export interface SearchResponse {
  query: string;
  results: MedicineMatch[];
}

/** GET /medicines/:id/leaflet?lang= -> leaflet, translated if lang != source. */
export interface LeafletResponse {
  medicine: Medicine;
  leaflet: Leaflet;
  /** Present when the requested language differs from the source language. */
  translation?: LeafletTranslation;
  requestedLanguage: SupportedLanguage;
}

/** POST /medicines/:id/ask  { question, lang } -> grounded answer over the leaflet. */
export interface AskResponse {
  answer: string;
  /** Section keys / source anchors the answer is grounded in. */
  citations: { sectionKey: string; page?: number }[];
  language: SupportedLanguage;
}
