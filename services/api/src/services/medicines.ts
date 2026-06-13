import type { Medicine } from '@medinfo/shared';
import { query } from '../context.js';

export interface MedicineRow {
  id: string;
  cnk: string | null;
  name: string;
  name_nl: string | null;
  name_fr: string | null;
  generic_name: string | null;
  strength: string | null;
  form: string | null;
  atc_code: string | null;
  auth_holder: string | null;
  prescription_only: boolean | null;
  leaflet_id: string | null;
}

const SELECT = `
  SELECT m.id, m.cnk, m.name, m.name_nl, m.name_fr, m.generic_name, m.strength,
         m.form, m.atc_code, m.auth_holder, m.prescription_only,
         (SELECT id FROM leaflets l WHERE l.medicine_id = m.id AND l.document_type = 'pil' LIMIT 1) AS leaflet_id
    FROM medicines m`;

export function toMedicine(r: MedicineRow): Medicine {
  return {
    id: r.id,
    name: r.name,
    ...(r.cnk ? { cnk: r.cnk } : {}),
    ...(r.generic_name ? { genericName: r.generic_name } : {}),
    ...(r.strength ? { strength: r.strength } : {}),
    ...(r.form ? { form: r.form } : {}),
    ...(r.atc_code ? { atcCode: r.atc_code } : {}),
    ...(r.auth_holder ? { authHolder: r.auth_holder } : {}),
    ...(r.prescription_only !== null ? { prescriptionOnly: r.prescription_only } : {}),
    ...(r.leaflet_id ? { leafletId: r.leaflet_id } : {}),
  };
}

export async function getMedicine(id: string): Promise<Medicine | null> {
  const res = await query<MedicineRow>(`${SELECT} WHERE m.id = $1`, [id]);
  return res.rows[0] ? toMedicine(res.rows[0]) : null;
}

export async function getMedicinesByIds(ids: string[]): Promise<Map<string, Medicine>> {
  if (ids.length === 0) return new Map();
  const res = await query<MedicineRow>(`${SELECT} WHERE m.id = ANY($1::uuid[])`, [ids]);
  return new Map(res.rows.map((r) => [r.id, toMedicine(r)]));
}

/** Exact / fuzzy name matches from Postgres (commercial + NL/FR + generic names). */
export async function findByName(q: string): Promise<{ medicine: Medicine; exact: boolean }[]> {
  const res = await query<MedicineRow & { is_exact: boolean }>(
    `SELECT m.id, m.cnk, m.name, m.name_nl, m.name_fr, m.generic_name, m.strength,
            m.form, m.atc_code, m.auth_holder, m.prescription_only,
            (SELECT id FROM leaflets l WHERE l.medicine_id = m.id AND l.document_type = 'pil' LIMIT 1) AS leaflet_id,
            (lower(m.name) = lower($1) OR lower(m.name_nl) = lower($1) OR lower(m.name_fr) = lower($1)) AS is_exact
       FROM medicines m
      WHERE m.name ILIKE '%' || $1 || '%'
         OR m.name_nl ILIKE '%' || $1 || '%'
         OR m.name_fr ILIKE '%' || $1 || '%'
         OR m.generic_name ILIKE '%' || $1 || '%'
      ORDER BY is_exact DESC
      LIMIT 25`,
    [q],
  );
  return res.rows.map((r) => ({ medicine: toMedicine(r), exact: r.is_exact }));
}
