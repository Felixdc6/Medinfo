import type { FastifyInstance } from 'fastify';

/**
 * Route surface for the app. Implemented incrementally:
 *   Phase 2 fills these in against the ingested data.
 *
 *   POST   /identify                 multipart image -> { imageId, extraction, best, candidates }
 *   GET    /medicines/search?q&lang  -> { results }
 *   GET    /medicines/:id/leaflet?lang -> reformatted leaflet (+ translation if non-source lang)
 *   POST   /medicines/:id/ask        { question, lang } -> grounded answer over the leaflet
 *   DELETE /images/:id               delete one uploaded box image (Settings)
 *   DELETE /images?deviceId=         delete all of a device's uploaded images (Settings)
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  const todo = async () =>
    ({ error: 'not_implemented', phase: 'Implemented in Phase 2 (backend API)' });

  app.post('/identify', todo);
  app.get('/medicines/search', todo);
  app.get('/medicines/:id/leaflet', todo);
  app.post('/medicines/:id/ask', todo);
  app.delete('/images/:id', todo);
  app.delete('/images', todo);

  app.log.info('routes registered (Phase 0 stubs)');
}
