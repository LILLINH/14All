// Characters that change what a reader sees without being visible, and words that borrow a look-alike
// letter from another alphabet. Both are used to hide text in a document an agent will read.

const INVISIBLE = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/u;
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const VARIATION_SELECTOR = '️';
const WORD = /[\p{L}\p{M}\p{N}_]+/gu;
const LATIN_LETTER = /\p{Script=Latin}/gu;
// A unit such as the micro sign in "3 \u03bcs" is one Greek letter and one Latin one. A look-alike word has
// at least two Latin letters, so a word needs two to be reported.
const MIN_LATIN_LETTERS = 2;
const OTHER_SCRIPTS = [
  ['Cyrillic', /\p{Script=Cyrillic}/u],
  ['Greek', /\p{Script=Greek}/u],
];

const codePoint = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

/** True when the joiner at index i of the code points sits between two emoji (an emoji sequence). */
function joinsEmoji(chars, i) {
  let before = i - 1;
  if (chars[before] === VARIATION_SELECTOR) before -= 1;
  return before >= 0 && PICTOGRAPHIC.test(chars[before]) && i + 1 < chars.length && PICTOGRAPHIC.test(chars[i + 1]);
}

/**
 * Invisible or bidirectional control characters and mixed-script words in a text. Returns
 * { line, kind, detail } with 1-based lines; the detail is a code point or the script names, never the text.
 */
export function findUnsafeText(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    const chars = Array.from(line);
    chars.forEach((ch, i) => {
      if (!INVISIBLE.test(ch)) return;
      if (ch === '‍' && joinsEmoji(chars, i)) return;
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
