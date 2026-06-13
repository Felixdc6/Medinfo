import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://medinfo:medinfo@localhost:5432/medinfo',
  qdrantUrl: process.env.QDRANT_URL ?? 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY,
  /** Path to the SAM AMP export XML. Defaults to the bundled offline fixture. */
  samAmpPath: process.env.SAM_AMP_PATH ?? resolve(packageRoot, 'fixtures/sam-amp-sample.xml'),
  /**
   * Optional directory of offline leaflet text fixtures, named `<amp>_<lang>.txt`.
   * When set, the leaflet step reads these instead of fetching PDFs over the network
   * (useful in sandboxes without access to the FAMHP file API).
   */
  leafletFixtureDir: process.env.LEAFLET_FIXTURE_DIR,
  migrationsDir: resolve(packageRoot, 'migrations'),
} as const;
