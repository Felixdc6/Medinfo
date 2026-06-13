import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISCLAIMER, SUPPORTED_LANGUAGES, isSupportedLanguage } from './index.js';

test('every supported language has a non-empty disclaimer', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(DISCLAIMER[lang] && DISCLAIMER[lang].length > 20, `missing disclaimer for ${lang}`);
  }
});

test('supports the six required Belgian-context languages', () => {
  assert.deepEqual([...SUPPORTED_LANGUAGES].sort(), ['ar', 'de', 'en', 'fr', 'nl', 'tr']);
});

test('isSupportedLanguage guards correctly', () => {
  assert.ok(isSupportedLanguage('nl'));
  assert.ok(!isSupportedLanguage('es'));
});
