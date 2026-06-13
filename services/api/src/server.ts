import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { embeddings, text, vlm } from './context.js';
import { registerRoutes } from './routes/index.js';

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });

  app.log.info({ vlm: vlm.id, embeddings: embeddings.id, text: text.id }, 'providers initialised');

  app.get('/health', async () => ({ status: 'ok' }));
  await registerRoutes(app);

  return app;
}

// Entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  buildServer()
    .then((app) => app.listen({ port, host: '0.0.0.0' }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
