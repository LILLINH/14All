import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findUnsafeText } from '../scripts/lib/text-safety.mjs';

const kinds = (text) => findUnsafeText(text).map((f) => [f.line, f.kind]);

test('plain ASCII, Vietnamese and emoji with a joiner are clean', () => {
  assert.deepEqual(findUnsafeText('plain text, 12 files.'), []);
  assert.deepEqual(findUnsafeText('đường dẫn tới thư mục, ệ ạ ữ'), []);
  assert.deepEqual(findUnsafeText('family \u{1F468}\u200d\u{1F469}\u200d\u{1F467} and ❤️\u200d\u{1F525}'), []);
});

test('an invisible or bidirectional control character is found, with its line and code point', () => {
  assert.deepEqual(kinds('ok\nhidden\u200bspace'), [[2, 'invisible']]);
  assert.equal(findUnsafeText('a\u200bb')[0].detail, 'U+200B');
  for (const ch of ['\u202e', '\u2066', '\u2060', '\u200f', '\u2069']) assert.equal(findUnsafeText(`x${ch}y`).length, 1, ch.codePointAt(0).toString(16));
});

test('a byte-order mark is found even at the start of the text', () => {
  assert.deepEqual(kinds('\ufeffhello'), [[1, 'invisible']]);
});

test('a joiner that is not between two emoji is found', () => {
  assert.deepEqual(kinds('a\u200db'), [[1, 'invisible']]);
  assert.deepEqual(kinds('\u{1F468}\u200d'), [[1, 'invisible']]);
});

test('a word that mixes Latin letters with Cyrillic or Greek ones is found', () => {
  assert.deepEqual(kinds('log in at p\u0430ypal.com'), [[1, 'mixed-script']]);
  assert.equal(findUnsafeText('p\u0430ypal')[0].detail, 'Latin+Cyrillic');
  assert.deepEqual(kinds('the \u03b1lpha release'), [[1, 'mixed-script']]);
});

test('a word written wholly in Greek or Cyrillic, a unit like the micro-second, and separate words are clean', () => {
  assert.deepEqual(findUnsafeText('latency 3 \u03bcs, \u043f\u0440\u0438\u0432\u0435\u0442'), []);
  assert.deepEqual(findUnsafeText('paypal \u0430 paypal'), []);
});

test('the finding never contains the text itself', () => {
  const [finding] = findUnsafeText('secret p\u0430ssword');
  assert.ok(!JSON.stringify(finding).includes('ssword'));
});

const cp = (n) => String.fromCodePoint(n);

test('characters that hide text from a reader but not from an agent are found', () => {
  const hidden = [0xE0041, 0xE0020, 0xE007F, 0xFE00, 0xFE0E, 0xE0100, 0x00AD, 0x180E, 0x2028, 0x2029, 0x3164, 0x115F, 0x1160, 0xFFA0, 0x2800, 0x034F, 0x061C, 0x001B, 0x0007, 0x0085, 0xE000];
  for (const n of hidden) assert.equal(findUnsafeText(`ab${cp(n)}cd`).length, 1, `U+${n.toString(16)}`);
});

test('a variation selector after an emoji or a keycap base, a tab and a CRLF line end are fine', () => {
  assert.deepEqual(findUnsafeText(`heart ${cp(0x2764)}${cp(0xFE0F)} and 1${cp(0xFE0F)}${cp(0x20E3)}`), []);
  assert.deepEqual(findUnsafeText('a\tb\r\nc\r\n'), []);
});

test('a variation selector after plain text is found', () => {
  assert.equal(findUnsafeText(`ab${cp(0xFE0F)}`).length, 1);
});
