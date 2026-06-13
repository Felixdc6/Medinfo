import type { SourceLanguage, SupportedLanguage } from './languages.js';

/**
 * A medicine as published in the Belgian Authentic Source of Medicines (SAM)
 * and the FAMHP medicinal-products database.
 */
export interface Medicine {
  id: string;
  /** CNK code (Belgian national product/package code), when known. */
  cnk?: string;
  /** Brand / commercial name as printed on the box, e.g. "Dafalgan". */
  name: string;
  /** Active-substance / generic name, e.g. "paracetamol". */
  genericName?: string;
  /** e.g. "500 mg". */
  strength?: string;
  /** Pharmaceutical form, e.g. "tablet", "siroop". */
  form?: string;
  /** WHO ATC classification code. */
  atcCode?: string;
  /** Marketing authorisation holder. */
  authHolder?: string;
  /** Whether the medicine requires a prescription. */
  prescriptionOnly?: boolean;
  leafletId?: string;
}

export type LeafletDocumentType = 'pil' | 'spc';

/**
 * Canonical, ordered set of leaflet sections. The reformatting step maps the
 * official leaflet's headings onto these so every medicine renders consistently.
 */
export const LEAFLET_SECTION_KEYS = [
  'what_is_it',        // What the medicine is and what it is used for
  'before_use',        // What you need to know before you use it (contraindications, warnings)
  'how_to_use',        // How to use / dosage
  'side_effects',      // Possible side effects
  'storage',           // How to store
  'composition',       // Contents of the pack and other information
  'other',             // Anything that does not map cleanly above
] as const;
export type LeafletSectionKey = (typeof LEAFLET_SECTION_KEYS)[number];

export interface LeafletSection {
  key: LeafletSectionKey;
  /** Human title in the section's language. */
  title: string;
  /** Verbatim text extracted from the official leaflet (kept for traceability). */
  originalText: string;
  /** Reformatted, plain-language version shown to users by default. */
  reformattedText: string;
  /**
   * Anchor back into the original document for this section
   * (e.g. PDF page number) so users can always reach the source.
   */
  sourceAnchor?: { page?: number };
}

/**
 * A leaflet in its source language (nl or fr), reformatted for readability but
 * always linked to the original published document.
 */
export interface Leaflet {
  id: string;
  medicineId: string;
  documentType: LeafletDocumentType;
  sourceLanguage: SourceLanguage;
  /** URL of the original published leaflet (FAMHP / medicinesdatabase.be). */
  originalSourceUrl: string;
  /** Publication / revision date of the source document. */
  sourceLastUpdated?: string;
  sections: LeafletSection[];
}

/**
 * Cached translation of a leaflet's reformatted sections into a non-source
 * language (de/en/ar/tr, and the other of nl/fr). Produced on demand.
 */
export interface LeafletTranslation {
  leafletId: string;
  language: SupportedLanguage;
  sections: Pick<LeafletSection, 'key' | 'title' | 'reformattedText'>[];
  generatedAt: string;
}

/** A box image uploaded for extraction. Retained per policy, deletable from Settings. */
export interface UploadedImage {
  id: string;
  /** Anonymous per-device identifier (no account required). */
  deviceId: string;
  createdAt: string;
  /** Set once the image has been deleted (by user or retention policy). */
  deletedAt?: string;
}
