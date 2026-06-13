# Medinfo

Photograph a medicine box → identify the medicine → read a **reformatted, multilingual**
version of its **official leaflet**, with every section linked back to the original source.

Built for Belgium: leaflet data comes from the FAMHP medicinal-products database and the
open-source SAM (Authentic Source of Medicines). Runs on **iOS and Android** (Expo).

> ⚠️ **Informational only.** Medinfo reformats official package leaflets for readability.
> It does not replace advice from a doctor or pharmacist. A disclaimer is pinned to the
> bottom of every screen in the app, in the user's language.

## How it works

1. **Capture** — the app takes a photo of the box (camera permission handled per-platform).
2. **Extract** — a vision model reads the printed name/strength/form. Default provider is
   **Qwen2-VL** (self-hosted, no API cost); **Claude** is an optional swap-in. Providers sit
   behind a single `VlmProvider` interface, so adding an open-source model is one file.
3. **Match** — the extracted name is matched against the SAM medicine index using exact +
   fuzzy + **semantic** search (Qdrant), which absorbs OCR noise and brand/generic differences.
4. **Read** — the matched leaflet is shown as clean, structured sections (reformatted at
   ingestion). Each section links to the **original** published document. Content is translated
   on demand into the user's language and cached.
5. **Ask** — optional RAG over the leaflet ("can I take this with alcohol?").

## Languages

UI and leaflet content: **Dutch, French, German, English, Arabic, Turkish** (`nl fr de en ar tr`).
Leaflets are natively `nl`/`fr`; other languages are produced by on-demand translation of the
reformatted text. Multilingual embeddings (`bge-m3`) make cross-lingual search work.

## Stack

| Part | Tech |
|------|------|
| `apps/mobile` | Expo + React Native + TypeScript (Expo Router) |
| `services/api` | Fastify (TS) — extraction, matching, leaflet, ask, image deletion |
| `services/ingestion` | SAM XML + FAMHP leaflet pipeline → Postgres + Qdrant |
| `packages/shared` | Domain types, API contracts, languages, disclaimer |
| `packages/providers` | Swappable VLM / embedding / text providers |
| Vectors | **Qdrant** (Cloud free tier in prod) |
| Metadata | **Postgres** (e.g. Supabase / Neon free tier in prod) |
| Models | **Qwen2-VL + bge-m3** self-hosted (Ollama/vLLM), or **Claude** |

```
apps/mobile/         Expo app (camera, leaflet viewer, settings, pinned disclaimer)
services/api/        Fastify API + provider wiring
services/ingestion/  Belgium SAM/FAMHP ingestion pipeline + migrations
packages/shared/     Cross-cutting TypeScript types & constants
packages/providers/  VLM / embedding / text provider implementations
docker-compose.yml   Local Qdrant + Postgres
.env.example         All backend configuration (copy to .env)
```

---

# Setup

## 1. Prerequisites

- **Node.js 20+** (22 recommended — `pnpm test` uses the Node test runner with glob patterns).
- **pnpm 9** — `npm i -g pnpm`.
- **Docker** (for local Postgres + Qdrant via `docker-compose`), or managed equivalents.
- For local models: **[Ollama](https://ollama.com)** (easiest) or any OpenAI-compatible server (vLLM, etc.).
- For the mobile app on a device: the **Expo Go** app, or an EAS dev build; Xcode / Android Studio for native builds.

## 2. Install & configure

```bash
pnpm install
cp .env.example .env     # then edit .env (see Configuration below)
```

## 3. Datastores (Postgres + Qdrant)

**Local (Docker):**

```bash
pnpm infra:up            # starts Postgres :5432 and Qdrant :6333
pnpm infra:down          # stop them
```

This matches the default `DATABASE_URL` / `QDRANT_URL` in `.env.example`. For managed
datastores in production, see [Deployment](#deployment).

Apply the database schema:

```bash
pnpm ingest migrate      # runs SQL migrations against DATABASE_URL
```

## 4. Models (VLM + embeddings + reformat/translate)

The API needs three model roles. Two options:

### Option A — self-hosted, no API cost (default)

Using Ollama:

```bash
ollama serve                       # exposes an OpenAI-compatible API at :11434/v1
ollama pull qwen2-vl:7b            # VLM (box extraction). Adjust the tag to an available Qwen2-VL build.
ollama pull qwen2.5:7b            # text model (reformat + translate)
ollama pull bge-m3                # multilingual embeddings
```

Then in `.env`:

```ini
VLM_PROVIDER=qwen
QWEN_BASE_URL=http://localhost:11434/v1
QWEN_MODEL=qwen2-vl:7b
QWEN_TEXT_MODEL=qwen2.5:7b
EMBEDDING_PROVIDER=bge-m3
EMBEDDING_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=bge-m3
REFORMAT_PROVIDER=qwen
```

> Any OpenAI-compatible endpoint works (e.g. vLLM): just point `*_BASE_URL` at it.

### Option B — Claude (no GPU to host)

```ini
VLM_PROVIDER=claude
REFORMAT_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_VLM_MODEL=claude-opus-4-8
CLAUDE_TEXT_MODEL=claude-opus-4-8
```

Claude covers extraction + reformat/translate, but **there is no Claude embeddings model** —
you still need an embeddings provider for semantic search and the "ask" RAG. Run `bge-m3`
(CPU-capable via Ollama) or point `EMBEDDING_BASE_URL` at a hosted embeddings endpoint.

## 5. Ingest the medicine + leaflet data

```bash
pnpm ingest              # migrate → load SAM medicine index → fetch & reformat leaflets
```

- `SAM_AMP_PATH` → path to the SAM "Actual Medicinal Products" XML export (download the full
  export from the [SAM portal](https://www.samportal.be/); the bulk XML is open — the live DICS
  webservices need an eHealth certificate, the download does not). Defaults to a bundled sample.
- Leaflet PDFs are fetched from the FAMHP file API referenced in the SAM export (needs network
  access to the Belgian endpoints).
- Run one step at a time with `pnpm ingest <migrate|medicines|leaflets>`.

## 6. Run

```bash
pnpm dev:api             # Fastify API on :3000 (PORT)
pnpm dev:mobile          # Expo dev server
```

For the mobile app, set the API base URL it should call (in `apps/mobile`, e.g. an
`apps/mobile/.env` or your shell). Use your machine's **LAN IP** on a physical device:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 pnpm dev:mobile
```

---

## Offline / no-model development

The ingestion pipeline ships with a SAM sample, a leaflet fixture, and a deterministic
hash-embedding provider, so it runs end-to-end with only Postgres + Qdrant — no model
server, no network:

```bash
pnpm infra:up
EMBEDDING_PROVIDER=hash \
LEAFLET_FIXTURE_DIR=services/ingestion/fixtures/leaflets \
  pnpm ingest
```

(The reformat step falls back to verbatim text when no text model is reachable.) The
`/identify`, leaflet-translation, and `/ask` endpoints still need a real model endpoint.

---

# Configuration

All backend config is environment variables (see `.env.example`). The mobile app reads
`EXPO_PUBLIC_API_URL` only.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | local Postgres | Postgres connection string (append `?sslmode=require` for managed DBs) |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant endpoint |
| `QDRANT_API_KEY` | — | Qdrant Cloud API key |
| `VLM_PROVIDER` | `qwen` | `qwen` \| `claude` — box extraction |
| `QWEN_BASE_URL` / `QWEN_API_KEY` / `QWEN_MODEL` | `:11434/v1` / — / `qwen2-vl:7b` | Qwen VLM endpoint |
| `QWEN_TEXT_MODEL` | `QWEN_MODEL` | text model for reformat/translate (qwen) |
| `ANTHROPIC_API_KEY` | — | required when any provider is `claude` |
| `CLAUDE_VLM_MODEL` / `CLAUDE_TEXT_MODEL` | `claude-opus-4-8` | Claude models |
| `EMBEDDING_PROVIDER` | `bge-m3` | `bge-m3` \| `hash` (offline) |
| `EMBEDDING_BASE_URL` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` | `:11434/v1` / `bge-m3` / `1024` | embeddings endpoint |
| `REFORMAT_PROVIDER` | `qwen` | `qwen` \| `claude` — leaflet reformat + translation |
| `SAM_AMP_PATH` | bundled sample | SAM AMP XML export path |
| `LEAFLET_FIXTURE_DIR` | — | offline leaflet fixtures (`<ampCode>_<lang>.txt`) |
| `PORT` | `3000` | API port |
| `IMAGE_DIR` | `./data/images` | where uploaded box images are stored |
| `IMAGE_RETENTION_HOURS` | `24` | retention; `0` = delete immediately after extraction |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | (mobile) API base URL |

> ⚠️ **Embedding dimensions are baked into the Qdrant collections at first creation.** If you
> switch embedding models, set `EMBEDDING_DIMENSIONS` to match and re-create the collections
> (delete and re-ingest), or vectors won't be comparable.

## API reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | liveness |
| `POST` | `/identify` | multipart `image` (+ `x-device-id` header) → extraction + ranked matches |
| `GET` | `/medicines/search?q=&lang=` | name/semantic search |
| `GET` | `/medicines/:id/leaflet?lang=` | reformatted leaflet, translated on demand |
| `POST` | `/medicines/:id/ask` | `{ question, lang }` → grounded, cited answer |
| `DELETE` | `/images/:id?deviceId=` | delete one uploaded image |
| `DELETE` | `/images?deviceId=` | delete all of a device's images |

---

# Testing

```bash
pnpm test        # Node test runner over backend pure logic (parser, segmentation, embeddings, shared)
pnpm typecheck   # type-check every package
pnpm build       # compile every package
```

`pnpm test` runs without any datastore or model. For end-to-end checks of the data-backed
endpoints, bring up `pnpm infra:up`, run the offline ingest above, start the API, and call it:

```bash
curl localhost:3000/health
curl "localhost:3000/medicines/search?q=dafalgan&lang=nl"
```

---

# Deployment

Everything has a free-tier-friendly managed option.

## 1. Postgres (managed)

Create a database on **Supabase**, **Neon**, or similar. Use its connection string as
`DATABASE_URL` and require TLS:

```ini
DATABASE_URL=postgresql://USER:PASS@HOST:5432/medinfo?sslmode=require
```

Run migrations against it once: `DATABASE_URL=... pnpm ingest migrate`.

## 2. Qdrant (managed)

Create a free cluster on **Qdrant Cloud**; set `QDRANT_URL=https://...` and `QDRANT_API_KEY=...`.
Collections are created automatically on first ingest.

## 3. Models

- **Self-hosted (Option A):** run Ollama/vLLM on a GPU host and point `QWEN_BASE_URL` /
  `EMBEDDING_BASE_URL` at it (keep it on a private network; it has no auth by default).
- **Claude (Option B):** set `VLM_PROVIDER=claude` + `REFORMAT_PROVIDER=claude` and provide
  `ANTHROPIC_API_KEY`; still run a small `bge-m3` embeddings endpoint for search/RAG.

## 4. Run the data ingestion

Ingestion is a batch job — run it on deploy and on a schedule (the FAMHP DB updates daily):

```bash
SAM_AMP_PATH=/data/sam-export.xml \
DATABASE_URL=... QDRANT_URL=... QDRANT_API_KEY=... \
EMBEDDING_BASE_URL=... \
  pnpm ingest
```

## 5. Deploy the API

The API runs with `tsx` (the workspace packages export TypeScript source). Build a container
and run `pnpm --filter @medinfo/api start`. Example `services/api/Dockerfile`:

```dockerfile
FROM node:22-slim
RUN corepack enable
WORKDIR /app
# Copy the workspace (api depends on packages/shared + packages/providers)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY services/api ./services/api
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["pnpm", "--filter", "@medinfo/api", "start"]
```

Deploy to **Fly.io**, **Render**, **Railway**, or any container host. Set all backend env
vars (datastore URLs/keys, model config). Front it with HTTPS.

**Production notes**
- **Image storage:** `IMAGE_DIR` is local disk — mount a persistent volume, or set
  `IMAGE_RETENTION_HOURS=0` to never persist (extraction still works; deletion is moot).
- **CORS / auth:** the API is currently open. Put it behind your gateway, and add CORS/auth
  before exposing it publicly.
- **Scaling:** the API is stateless apart from `IMAGE_DIR`; scale horizontally if you make
  image storage shared (object storage) or disable retention.

## 6. Build & ship the mobile app

Use **EAS** (Expo Application Services):

```bash
cd apps/mobile
npm i -g eas-cli && eas login
# point the build at your deployed API:
EXPO_PUBLIC_API_URL=https://api.your-domain.tld eas build --platform all
eas submit --platform ios      # / android, to the stores
```

Camera requires a real device or dev build (not the web target). iOS camera usage string and
Android `CAMERA` permission are already declared in `apps/mobile/app.json`.

---

## Privacy

Uploaded box images are retained per `IMAGE_RETENTION_HOURS` and **can be deleted at any time
from Settings** (`DELETE /images`). No account is required (anonymous per-device id). Leaflet
content is shown with attribution to the official FAMHP source and a link to the original.

## Roadmap

- [x] **Phase 0** — Monorepo scaffold, shared domain model, provider interfaces, infra, disclaimer.
- [x] **Phase 1** — Ingestion: SAM index + FAMHP leaflets → reformatted-and-linked sections → Postgres + Qdrant.
- [x] **Phase 2** — API: `/identify`, `/medicines/search`, `/leaflet` (+on-demand translation), `/ask` (RAG), image deletion.
- [x] **Phase 3** — Mobile: camera, identify flow, leaflet viewer, search, ask, settings.
- [x] **Phase 4** — Compliance & polish: attribution, accessibility, offline cache, error states, tests.

## Sources

- FAMHP medicinal-products database — https://medicinesdatabase.be/
- SAM — Authentic Source of Medicines — https://www.samportal.be/

## License

Apache-2.0 (see `LICENSE`).
