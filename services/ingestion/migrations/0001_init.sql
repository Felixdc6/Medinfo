-- Medinfo core schema. Ids are application-generated UUIDs (crypto.randomUUID),
-- so no pgcrypto extension is required.

CREATE TABLE IF NOT EXISTS medicines (
  id               UUID PRIMARY KEY,
  source_amp_code  TEXT UNIQUE NOT NULL,   -- SAM Actual Medicinal Product code
  cnk              TEXT,                    -- Belgian national package code
  name             TEXT NOT NULL,           -- commercial name as printed on the box
  name_nl          TEXT,
  name_fr          TEXT,
  generic_name     TEXT,                    -- active substance
  strength         TEXT,
  form             TEXT,
  atc_code         TEXT,
  auth_holder      TEXT,
  prescription_only BOOLEAN,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One leaflet row per (medicine, source language, document type).
CREATE TABLE IF NOT EXISTS leaflets (
  id                  UUID PRIMARY KEY,
  medicine_id         UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  document_type       TEXT NOT NULL,        -- 'pil' | 'spc'
  source_language     TEXT NOT NULL,        -- 'nl' | 'fr'
  original_source_url TEXT NOT NULL,
  source_last_updated DATE,
  processed_at        TIMESTAMPTZ,          -- null until sections have been built
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (medicine_id, document_type, source_language)
);

CREATE TABLE IF NOT EXISTS leaflet_sections (
  id               UUID PRIMARY KEY,
  leaflet_id       UUID NOT NULL REFERENCES leaflets(id) ON DELETE CASCADE,
  section_key      TEXT NOT NULL,           -- canonical LeafletSectionKey
  ordinal          INT  NOT NULL,
  title            TEXT NOT NULL,
  original_text    TEXT NOT NULL,           -- verbatim, for traceability
  reformatted_text TEXT NOT NULL,           -- plain-language version shown by default
  source_page      INT
);
CREATE INDEX IF NOT EXISTS leaflet_sections_leaflet_idx ON leaflet_sections(leaflet_id);

-- Cached on-demand translations of the reformatted sections (de/en/ar/tr, etc.).
CREATE TABLE IF NOT EXISTS leaflet_translations (
  id           UUID PRIMARY KEY,
  leaflet_id   UUID NOT NULL REFERENCES leaflets(id) ON DELETE CASCADE,
  language     TEXT NOT NULL,
  sections     JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (leaflet_id, language)
);

-- Uploaded medicine-box images. Deletable from Settings; auto-deleted per policy.
CREATE TABLE IF NOT EXISTS uploaded_images (
  id         UUID PRIMARY KEY,
  device_id  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS uploaded_images_device_idx ON uploaded_images(device_id);
