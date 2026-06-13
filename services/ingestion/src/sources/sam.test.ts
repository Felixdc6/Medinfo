import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSamAmpXml } from './sam.js';

const XML = `<?xml version="1.0"?>
<ExportActualMedicines>
  <Amp code="AMP1">
    <vmp code="v1"><atc code="N02BE01"/></vmp>
    <Data from="2020-01-01">
      <officialName>Dafalgan 500 mg</officialName>
      <prescriptionName><nl>Dafalgan 500 mg tabletten</nl><fr>Dafalgan 500 mg comprimés</fr></prescriptionName>
    </Data>
    <Ampp>
      <Data from="2020-01-01">
        <prescriptionType>FreeDelivery</prescriptionType>
        <dmpp><code>0123456</code><codeType>CNK</codeType></dmpp>
        <leafletLink><nl>http://x/nl.pdf</nl><fr>http://x/fr.pdf</fr></leafletLink>
        <spcLink><nl>http://x/spc_nl.pdf</nl></spcLink>
      </Data>
    </Ampp>
  </Amp>
</ExportActualMedicines>`;

test('parses names, atc and prescription status', () => {
  const [m] = parseSamAmpXml(XML);
  assert.equal(m?.ampCode, 'AMP1');
  assert.equal(m?.nameNl, 'Dafalgan 500 mg tabletten');
  assert.equal(m?.nameFr, 'Dafalgan 500 mg comprimés');
  assert.equal(m?.atcCode, 'N02BE01');
  assert.equal(m?.prescriptionOnly, false);
});

test('preserves leading-zero CNK codes', () => {
  const [m] = parseSamAmpXml(XML);
  assert.equal(m?.cnk, '0123456'); // must NOT become 123456
});

test('extracts pil + spc leaflet links per language, deduped', () => {
  const [m] = parseSamAmpXml(XML);
  const refs = m?.leaflets ?? [];
  assert.equal(refs.length, 3);
  assert.ok(refs.some((r) => r.documentType === 'pil' && r.language === 'nl'));
  assert.ok(refs.some((r) => r.documentType === 'pil' && r.language === 'fr'));
  assert.ok(refs.some((r) => r.documentType === 'spc' && r.language === 'nl'));
});
