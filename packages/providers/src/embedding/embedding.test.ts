import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HashEmbeddingProvider } from './index.js';

test('hash embeddings are deterministic and correctly sized', async () => {
  const e = new HashEmbeddingProvider(32);
  const [a, b] = await e.embed(['paracetamol 500 mg', 'paracetamol 500 mg']);
  assert.equal(a!.length, 32);
  assert.deepEqual(a, b);
});

test('hash embeddings are L2-normalised', async () => {
  const e = new HashEmbeddingProvider(64);
  const [v] = await e.embed(['ibuprofen']);
  const norm = Math.hypot(...v!);
  assert.ok(Math.abs(norm - 1) < 1e-9, `expected unit norm, got ${norm}`);
});

test('different text yields different vectors', async () => {
  const e = new HashEmbeddingProvider(32);
  const [a, b] = await e.embed(['aspirine', 'morfine']);
  assert.notDeepEqual(a, b);
});
