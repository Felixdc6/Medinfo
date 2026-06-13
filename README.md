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

## Privacy

Uploaded box images are retained per `IMAGE_RETENTION_HOURS` and **can be deleted at any time
from Settings** (`DELETE /images`). No account is required (anonymous per-device id).

## Stack

| Part | Tech |
|------|------|
| `apps/mobile` | Expo + React Native + TypeScript |
| `services/api` | Fastify (TS) — extraction, matching, leaflet, ask, image deletion |
| `services/ingestion` | SAM XML + FAMHP leaflet pipeline → Postgres + Qdrant |
| `packages/shared` | Domain types, API contracts, languages, disclaimer (shared by all) |
| Vectors | **Qdrant** (Cloud free tier) |
| Metadata | **Postgres** (e.g. Supabase free tier) |

## Repository layout

```
apps/mobile/         Expo app (camera, leaflet viewer, settings, pinned disclaimer)
services/api/        Fastify API + provider abstractions (VLM, embeddings)
services/ingestion/  Belgium SAM/FAMHP ingestion pipeline
packages/shared/     Cross-cutting TypeScript types & constants
docker-compose.yml   Local Qdrant + Postgres (mirror of the managed free tiers)
.env.example         All configuration (copy to .env)
```

## Getting started

```bash
pnpm install
cp .env.example .env          # fill in provider endpoints / keys
pnpm infra:up                 # local Qdrant + Postgres
pnpm ingest                   # build the medicine index + leaflets (Phase 1)
pnpm dev:api                  # start the API
pnpm dev:mobile               # start the Expo app
```

### Run the ingestion offline (no model server, no network)

The pipeline ships with a SAM sample and a leaflet fixture, plus a deterministic
hash-embedding provider, so it runs end-to-end with only Postgres + Qdrant:

```bash
pnpm infra:up
EMBEDDING_PROVIDER=hash \
LEAFLET_FIXTURE_DIR=services/ingestion/fixtures/leaflets \
REFORMAT_PROVIDER=qwen \
  pnpm ingest                 # migrate -> medicines -> leaflets
```

Point `SAM_AMP_PATH` at the real SAM export and drop `LEAFLET_FIXTURE_DIR` to ingest
live FAMHP leaflets (requires network access to the Belgian endpoints).
`pnpm ingest <step>` runs a single step: `migrate` | `medicines` | `leaflets`.

## Roadmap

- [x] **Phase 0** — Monorepo scaffold, shared domain model, provider interfaces, infra, disclaimer.
- [x] **Phase 1** — Ingestion: SAM index + FAMHP leaflets → reformatted-and-linked sections → Postgres + Qdrant.
- [x] **Phase 2** — API: `/identify`, `/medicines/search`, `/leaflet` (+on-demand translation), `/ask` (RAG), image deletion.
- [x] **Phase 3** — Mobile: camera, identify flow, leaflet viewer (readable/original toggle, source link), search, ask, settings (language + delete photos).
- [x] **Phase 4** — Compliance & polish: source attribution, accessibility labels, offline leaflet cache, error/retry states, test suite.

## Testing

```bash
pnpm test        # Node test runner over backend pure logic (parser, segmentation, embeddings, shared)
pnpm typecheck   # all packages
```

## Sources

- FAMHP medicinal-products database — https://medicinesdatabase.be/
- SAM — Authentic Source of Medicines — https://www.samportal.be/

## License

Apache-2.0 (see `LICENSE`).
