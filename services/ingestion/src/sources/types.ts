import type { LeafletDocumentType, SourceLanguage } from '@medinfo/shared';

export interface ParsedLeafletRef {
  language: SourceLanguage;
  documentType: LeafletDocumentType;
  url: string;
}

/** A medicine as parsed from the SAM AMP export (one per Actual Medicinal Product). */
export interface ParsedMedicine {
  ampCode: string;
  name: string;
  nameNl?: string;
  nameFr?: string;
  genericName?: string;
  strength?: string;
  form?: string;
  atcCode?: string;
  authHolder?: string;
  prescriptionOnly?: boolean;
  cnk?: string;
  leaflets: ParsedLeafletRef[];
}
