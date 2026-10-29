// Characters that change what a reader sees, or that are not seen at all, and words that borrow a look-alike
// letter from another alphabet. Both are used to hide text in a document an agent will read. Everything is
// written with code point numbers and Unicode categories, so this file holds no invisible character itself.

// Format characters (zero-width, bidirectional controls, soft hyphen, the tag characters used to smuggle
// ASCII), private use, and control characters.
const HIDDEN_CATEGORIES = /[\p{Cf}\p{Co}\p{Cc}]/u;
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const KEYCAP_BASE = /[0-9#*]/;
const WORD = /[\p{L}\p{M}\p{N}_]+/gu;
const LATIN_LETTER = /\p{Script=Latin}/gu;
const OTHER_SCRIPTS = [
  ['Cyrillic', /\p{Script=Cyrillic}/u],
  ['Greek', /\p{Script=Greek}/u],
];
// A unit such as the micro sign in "3 us" is one Greek letter and one Latin one. A look-alike word has
// at least two Latin letters, so a word needs two to be reported.
const MIN_LATIN_LETTERS = 2;

const ZERO_WIDTH_JOINER = 0x200d;
const VARIATION_SELECTOR_TEXT = 0xfe0e;
const VARIATION_SELECTOR_EMOJI = 0xfe0f;
// Spaces and fillers that draw nothing: line and paragraph separators, Hangul fillers, the braille blank,
// the combining grapheme joiner.
const BLANK = new Set([0x2028, 0x2029, 0x3164, 0x115f, 0x1160, 0xffa0, 0x2800, 0x034f]);

const isVariationSelector = (n) => (n >= 0xfe00 && n <= 0xfe0f) || (n >= 0xe0100 && n <= 0xe01ef);

/** True for a character a reader cannot see or that is not text. A tab and the line ends are text. */
function isHidden(ch) {
  const n = ch.codePointAt(0);
  if (n === 0x09 || n === 0x0a || n === 0x0d) return false;
  return HIDDEN_CATEGORIES.test(ch) || BLANK.has(n) || isVariationSelector(n);
}

const codePoint = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

/** True when the joiner at index i of the characters sits between two emoji (an emoji sequence). */
function joinsEmoji(chars, i) {
  let before = i - 1;
  if (chars[before]?.codePointAt(0) === VARIATION_SELECTOR_EMOJI) before -= 1;
  return before >= 0 && PICTOGRAPHIC.test(chars[before]) && i + 1 < chars.length && PICTOGRAPHIC.test(chars[i + 1]);
}

/** True when a variation selector follows an emoji or a keycap base, where it selects how the emoji is drawn. */
function selectsEmoji(chars, i) {
  const before = chars[i - 1];
  return before !== undefined && (PICTOGRAPHIC.test(before) || KEYCAP_BASE.test(before));
}

/**
 * Hidden characters and mixed-script words in a text. Returns { line, kind, detail } with 1-based lines; the
 * detail is a code point or the script names, never the text.
 */
export function findUnsafeText(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    const chars = Array.from(line);
    chars.forEach((ch, i) => {
      if (!isHidden(ch)) return;
      const n = ch.codePointAt(0);
      if (n === ZERO_WIDTH_JOINER && joinsEmoji(chars, i)) return;
      if ((n === VARIATION_SELECTOR_EMOJI || n === VARIATION_SELECTOR_TEXT) && selectsEmoji(chars, i)) return;
      findings.push({ line: index + 1, kind: 'invisible', detail: codePoint(ch) });
    });
    for (const [word] of line.matchAll(WORD)) {
      if ((word.match(LATIN_LETTER) ?? []).length < MIN_LATIN_LETTERS) continue;
      const other = OTHER_SCRIPTS.find(([, pattern]) => pattern.test(word));
      if (other) findings.push({ line: index + 1, kind: 'mixed-script', detail: `Latin+${other[0]}` });
    }
  });
  return findings;
}
