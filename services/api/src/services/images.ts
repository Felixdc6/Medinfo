import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IMAGE_DIR, query } from '../context.js';

const path = (id: string) => resolve(IMAGE_DIR, id);

/** Persist an uploaded box image and record it (deletable later from Settings). */
export async function storeImage(deviceId: string, data: Buffer): Promise<string> {
  const id = randomUUID();
  await writeFile(path(id), data);
  await query('INSERT INTO uploaded_images (id, device_id) VALUES ($1, $2)', [id, deviceId]);
  return id;
}

/** Delete one image's bytes and mark it deleted. Scoped to the owning device when
 *  a deviceId is supplied. Returns whether a row was affected. */
export async function deleteImage(id: string, deviceId?: string): Promise<boolean> {
  const res = await query(
    `UPDATE uploaded_images SET deleted_at = now()
      WHERE id = $1 AND deleted_at IS NULL ${deviceId ? 'AND device_id = $2' : ''}`,
    deviceId ? [id, deviceId] : [id],
  );
  await rm(path(id), { force: true });
  return (res.rowCount ?? 0) > 0;
}

/** Delete all of a device's uploaded images (Settings: "delete uploaded photos"). */
export async function deleteDeviceImages(deviceId: string): Promise<number> {
  const ids = (
    await query<{ id: string }>(
      'SELECT id FROM uploaded_images WHERE device_id = $1 AND deleted_at IS NULL',
      [deviceId],
    )
  ).rows;
  await Promise.all(ids.map((r) => rm(path(r.id), { force: true })));
  const res = await query(
    'UPDATE uploaded_images SET deleted_at = now() WHERE device_id = $1 AND deleted_at IS NULL',
    [deviceId],
  );
  return res.rowCount ?? 0;
}
