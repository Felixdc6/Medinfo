import type { FastifyInstance } from 'fastify';
import {
  type AskResponse,
  type IdentifyResponse,
  type LeafletResponse,
  type SearchResponse,
  type SupportedLanguage,
  isSupportedLanguage,
} from '@medinfo/shared';
import { IMAGE_RETENTION_HOURS, vlm } from '../context.js';
import { matchMedicine } from '../services/matching.js';
import { getMedicine } from '../services/medicines.js';
import { getLeaflet } from '../services/leaflet.js';
import { askLeaflet } from '../services/ask.js';
import { deleteDeviceImages, deleteImage, storeImage } from '../services/images.js';

function lang(value: unknown, fallback: SupportedLanguage = 'nl'): SupportedLanguage {
  return typeof value === 'string' && isSupportedLanguage(value) ? value : fallback;
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // POST /identify — multipart image -> extract -> match.
  app.post('/identify', async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: 'image_required' });
    const deviceId = String(request.headers['x-device-id'] ?? 'anonymous');
    const buffer = await file.toBuffer();

    const imageId = await storeImage(deviceId, buffer);
    const extraction = await vlm.extractMedication(buffer, file.mimetype);
    if (IMAGE_RETENTION_HOURS === 0) await deleteImage(imageId); // privacy: don't retain

    const candidates = await matchMedicine(extraction.name || extraction.rawText);
    const response: IdentifyResponse = {
      imageId,
      extraction,
      candidates,
      ...(candidates[0] ? { best: candidates[0] } : {}),
    };
    return response;
  });

  // GET /medicines/search?q=&lang=
  app.get('/medicines/search', async (request, reply) => {
    const q = String((request.query as Record<string, unknown>).q ?? '').trim();
    if (!q) return reply.code(400).send({ error: 'query_required' });
    const response: SearchResponse = { query: q, results: await matchMedicine(q) };
    return response;
  });

  // GET /medicines/:id/leaflet?lang=
  app.get('/medicines/:id/leaflet', async (request, reply) => {
    const { id } = request.params as { id: string };
    const requestedLanguage = lang((request.query as Record<string, unknown>).lang);
    const medicine = await getMedicine(id);
    if (!medicine) return reply.code(404).send({ error: 'medicine_not_found' });
    const result = await getLeaflet(id, requestedLanguage);
    if (!result) return reply.code(404).send({ error: 'leaflet_not_found' });
    const response: LeafletResponse = {
      medicine,
      leaflet: result.leaflet,
      requestedLanguage,
      ...(result.translation ? { translation: result.translation } : {}),
    };
    return response;
  });

  // POST /medicines/:id/ask  { question, lang }
  app.post('/medicines/:id/ask', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { question?: string; lang?: string };
    const question = (body.question ?? '').trim();
    if (!question) return reply.code(400).send({ error: 'question_required' });
    if (!(await getMedicine(id))) return reply.code(404).send({ error: 'medicine_not_found' });
    const response: AskResponse = await askLeaflet(id, question, lang(body.lang));
    return response;
  });

  // DELETE /images/:id?deviceId=  (Settings: delete one uploaded photo)
  app.delete('/images/:id', async (request) => {
    const { id } = request.params as { id: string };
    const deviceId = (request.query as Record<string, unknown>).deviceId;
    const deleted = await deleteImage(id, typeof deviceId === 'string' ? deviceId : undefined);
    return { deleted };
  });

  // DELETE /images?deviceId=  (Settings: delete all uploaded photos)
  app.delete('/images', async (request, reply) => {
    const deviceId = (request.query as Record<string, unknown>).deviceId;
    if (typeof deviceId !== 'string' || !deviceId) return reply.code(400).send({ error: 'deviceId_required' });
    return { deleted: await deleteDeviceImages(deviceId) };
  });

  app.log.info('routes registered');
}
