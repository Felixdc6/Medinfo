import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import type { SourceLanguage } from '@medinfo/shared';
import type { ParsedLeafletRef, ParsedMedicine } from './types.js';

/**
 * Parser for the Belgian SAM v2 "Actual Medicinal Products" (AMP) XML export.
 *
 * The real export is namespaced and time-versioned. We strip namespace prefixes
 * and read fields by local name, picking the currently-valid `Data` block, so the
 * parser tolerates the live prefixes. Field names follow the SAM v2 model
 * (officialName, prescriptionName, Ampp/dmpp/CNK, leafletLink/spcLink); validate
 * against the live XSD when first run with network access — the structure is
 * isolated here so adjustments stay local.
 *
 * Generic name / ATC / strength live in the VMP export and are joined in later;
 * we read ATC opportunistically if present on the referenced vmp node.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  // Keep all values as strings: CNK / authorisation numbers can have leading
  // zeros that numeric coercion would silently drop.
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => ['Amp', 'Ampp', 'dmpp', 'Data'].includes(name),
});

export function parseSamAmpFile(path: string): ParsedMedicine[] {
  return parseSamAmpXml(readFileSync(path, 'utf8'));
}

export function parseSamAmpXml(xml: string): ParsedMedicine[] {
  const root = parser.parse(xml) as Record<string, unknown>;
  const amps = collect(root, 'Amp');
  return amps.map(parseAmp).filter((m): m is ParsedMedicine => m !== null);
}

function parseAmp(amp: Record<string, unknown>): ParsedMedicine | null {
  const ampCode = str(amp.code);
  if (!ampCode) return null;

  const data = currentData(amp.Data);
  const prescription = obj(data?.prescriptionName);
  const nameNl = str(prescription?.nl);
  const nameFr = str(prescription?.fr);
  const name = nameNl ?? nameFr ?? str(data?.officialName) ?? str(data?.abbreviatedName) ?? ampCode;

  const atcCode = str(obj(obj(amp.vmp)?.atc)?.code) ?? str(obj(amp.vmp)?.atc);

  const leaflets: ParsedLeafletRef[] = [];
  let cnk: string | undefined;
  let prescriptionOnly: boolean | undefined;

  for (const ampp of asArray(amp.Ampp)) {
    const ad = currentData((ampp as Record<string, unknown>).Data);
    if (!ad) continue;
    cnk ??= extractCnk(ad);
    prescriptionOnly ??= isPrescriptionOnly(str(ad.prescriptionType));
    leaflets.push(...extractLeaflets(ad));
  }

  return {
    ampCode,
    name,
    ...(nameNl ? { nameNl } : {}),
    ...(nameFr ? { nameFr } : {}),
    ...(atcCode ? { atcCode } : {}),
    ...(cnk ? { cnk } : {}),
    ...(prescriptionOnly !== undefined ? { prescriptionOnly } : {}),
    leaflets: dedupeLeaflets(leaflets),
  };
}

function extractLeaflets(data: Record<string, unknown>): ParsedLeafletRef[] {
  const out: ParsedLeafletRef[] = [];
  const pushLink = (node: unknown, documentType: 'pil' | 'spc') => {
    const link = obj(node);
    if (!link) return;
    for (const language of ['nl', 'fr'] as SourceLanguage[]) {
      const url = str(link[language]);
      if (url) out.push({ language, documentType, url });
    }
  };
  pushLink(data.leafletLink, 'pil');
  pushLink(data.spcLink, 'spc');
  return out;
}

function extractCnk(data: Record<string, unknown>): string | undefined {
  for (const dmpp of asArray(data.dmpp)) {
    const d = obj(dmpp);
    if (d && str(d.codeType)?.toUpperCase() === 'CNK') return str(d.code);
  }
  return undefined;
}

function isPrescriptionOnly(prescriptionType?: string): boolean | undefined {
  if (!prescriptionType) return undefined;
  const t = prescriptionType.toLowerCase();
  if (t.includes('free') || t.includes('vrij') || t.includes('libre')) return false;
  return true;
}

/** SAM `Data` blocks are time-bound; pick the one with no `to` (currently valid). */
function currentData(node: unknown): Record<string, unknown> | undefined {
  const arr = asArray(node).map(obj).filter((d): d is Record<string, unknown> => !!d);
  if (arr.length === 0) return undefined;
  return arr.find((d) => !d.to) ?? arr[arr.length - 1];
}

function dedupeLeaflets(refs: ParsedLeafletRef[]): ParsedLeafletRef[] {
  const seen = new Map<string, ParsedLeafletRef>();
  for (const r of refs) seen.set(`${r.documentType}:${r.language}`, r);
  return [...seen.values()];
}

// --- small tolerant helpers ---
function asArray(v: unknown): unknown[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}
function obj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}
function str(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number') return String(v);
  // fast-xml-parser puts text of an element with attributes under '#text'
  const o = obj(v);
  if (o && typeof o['#text'] === 'string') return (o['#text'] as string).trim() || undefined;
  return undefined;
}

/** Recursively collect all nodes with the given local name. */
function collect(node: unknown, name: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const visit = (n: unknown) => {
    const o = obj(n);
    if (!o) {
      if (Array.isArray(n)) n.forEach(visit);
      return;
    }
    for (const [key, value] of Object.entries(o)) {
      if (key === name) asArray(value).forEach((v) => { const vo = obj(v); if (vo) out.push(vo); });
      else visit(value);
    }
  };
  visit(node);
  return out;
}
