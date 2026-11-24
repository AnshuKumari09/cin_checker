// Run: node --test   (Node 18+). Hinglish: ye tests batate hain ki logic sahi chal raha hai.
const test = require('node:test');
const assert = require('node:assert');
const P = require('../js/cin-parser.js');
const Y = 2026;

test('valid listed public company', () => {
  const r = P.parseOne('L17110MH1973PLC019786', Y);
  assert.ok(r.valid);
  assert.deepStrictEqual([r.info.listing, r.info.state, r.info.year, r.info.typeCode],
    ['Listed', 'Maharashtra', 1973, 'PLC']);
});
test('valid unlisted private, lowercase accepted', () => {
  const r = P.parseOne('u72900ka2019ptc123456', Y);
  assert.ok(r.valid); assert.strictEqual(r.info.listing, 'Unlisted'); assert.strictEqual(r.info.state, 'Karnataka');
});
test('OPC and government company', () => {
  assert.ok(P.parseOne('U74999DL2016OPC312345', Y).valid);
  assert.strictEqual(P.parseOne('L40101DL1975GOI007966', Y).info.typeLabel, 'Government company (Central)');
});
test('wrong length says how many missing', () => {
  const r = P.parseOne('U7290KA2019PTC123456', Y);
  assert.ok(!r.valid); assert.match(r.errors[0].msg, /Too short.*20.*1 missing/);
});
test('bad state / future year / bad type are pinned to the right segment', () => {
  assert.deepStrictEqual(P.parseOne('U12345XX2020PTC123456', Y).errors[0].segs, [2]);
  assert.deepStrictEqual(P.parseOne('U72900KA2031PTC123456', Y).errors[0].segs, [3]);
  assert.deepStrictEqual(P.parseOne('U72900KA2019ABC123456', Y).errors[0].segs, [4]);
});
test('private company cannot be listed', () => {
  const r = P.parseOne('L72900KA2019PTC123456', Y);
  assert.ok(!r.valid); assert.deepStrictEqual(r.errors[0].segs, [0, 4]);
});
test('OPC before 2013 is invalid', () => {
  assert.ok(!P.parseOne('U74999DL2010OPC312345', Y).valid);
});
test('LLPIN valid / missing hyphen / bad digits', () => {
  assert.ok(P.parseOne('AAA-1234', Y).valid);
  assert.match(P.parseOne('AAA1234', Y).errors[0].msg, /AAA-1234/);
  assert.ok(!P.parseOne('AAA-12', Y).valid);
});
test('junk is Unknown', () => {
  assert.strictEqual(P.parseOne('hello', Y).kind, 'Unknown');
});
test('list: separators, duplicates, empty', () => {
  const { results } = P.parseList('AAA-1234, AAA-1234\n\n  L17110MH1973PLC019786;', Y);
  assert.strictEqual(results.length, 3); assert.strictEqual(results[1].duplicateOf, 1);
  assert.strictEqual(P.parseList('   \n ', Y).results.length, 0);
});
test('list: 500 lines and truncation', () => {
  assert.strictEqual(P.parseList('AAA-1234\n'.repeat(500), Y).results.length, 500);
  assert.ok(P.parseList('AAA-1234\n'.repeat(5001), Y).truncated);
});
test('csv escapes quotes', () => {
  assert.match(P.toCSV(P.parseList('AAA-1234', Y).results), /"AAA-1234"/);
});
