import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentLeaflet } from './segment.js';

// A table of contents (headings clustered) followed by the real sections.
const NL = `Bijsluiter
1. Wat is X en waarvoor wordt het gebruikt
2. Wanneer mag u dit middel niet innemen
3. Hoe neemt u dit middel in
4. Mogelijke bijwerkingen
5. Hoe bewaart u dit middel
6. Inhoud van de verpakking en overige informatie

1. Wat is X en waarvoor wordt het gebruikt
BODY-WHAT
2. Wanneer mag u dit middel niet innemen of moet u er extra voorzichtig mee zijn
BODY-BEFORE
3. Hoe neemt u dit middel in
BODY-HOW
4. Mogelijke bijwerkingen
BODY-SIDE
5. Hoe bewaart u dit middel
BODY-STORAGE
6. Inhoud van de verpakking en overige informatie
BODY-COMP`;

test('detects all 6 NL sections in order', () => {
  const s = segmentLeaflet(NL, 'nl');
  assert.deepEqual(
    s.map((x) => x.key),
    ['what_is_it', 'before_use', 'how_to_use', 'side_effects', 'storage', 'composition'],
  );
});

test('uses the real header (last occurrence), not the table of contents', () => {
  const s = segmentLeaflet(NL, 'nl');
  // If the TOC had won, the body would be empty; assert real body captured.
  assert.match(s[0]!.originalText, /BODY-WHAT/);
  assert.match(s.at(-1)!.originalText, /BODY-COMP/);
});

test('matches accent-stripped, upper-cased FR headers', () => {
  const FR = `1. QU'EST-CE QUE X ET DANS QUEL CAS EST-IL UTILISE
corps un
4. QUELS SONT LES EFFETS INDESIRABLES EVENTUELS
corps quatre`;
  const s = segmentLeaflet(FR, 'fr');
  const keys = s.map((x) => x.key);
  assert.ok(keys.includes('what_is_it'));
  assert.ok(keys.includes('side_effects'));
});
