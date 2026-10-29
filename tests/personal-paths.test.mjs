import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPersonalPaths } from '../scripts/lib/personal-paths.mjs';

const lines = (text) => findPersonalPaths(text).map((f) => f.line);
// Built from parts, so this file holds no home path of a real-looking name itself.
const linux = (name, rest = 'work') => `/home/${name}/${rest}`;
const mac = (name, rest = 'x') => `/Users/${name}/${rest}`;
const windows = (name, rest = 'Desktop') => `C:\\Users\\${name}\\${rest}`;

test('a home directory of a real person is found, on Linux, macOS and Windows', () => {
  assert.deepEqual(lines(`cd ${linux('alice')}`), [1]);
  assert.deepEqual(lines(`open "${mac('bob')}"`), [1]);
  assert.deepEqual(lines(`see ${windows('carol')}`), [1]);
  assert.deepEqual(lines(`path=\`${linux('dave', 'src')}\``), [1]);
  assert.deepEqual(lines(linux('erin', 'notes.md')), [1]);
});

test('placeholders and home-relative forms are clean', () => {
  for (const text of [linux('runner', 'work/x'), mac('you', 'project'), linux('user', 'x'), linux('name', 'x'), mac('username'), linux('example', 'x'), linux('Runner'), linux('u', 'app/.env'), '~/work', '$HOME/work', '${HOME}/work']) {
    assert.deepEqual(lines(text), [], text);
  }
});

test('a path that is part of a URL or another word is not a home directory', () => {
  assert.deepEqual(lines(`https://example.com${linux('alice', 'page')}`), []);
  assert.deepEqual(lines(`the /usr${linux('alice', 'file')} here`), []);
  assert.deepEqual(lines('no path at all'), []);
});

test('the line number is right on a multi-line text, and the finding never holds the path', () => {
  const found = findPersonalPaths(`one\ntwo\ncd ${linux('alice')}\nfour`);
  assert.deepEqual(found, [{ line: 3 }]);
});

test('a line with several paths is one finding', () => {
  assert.deepEqual(lines(`${linux('alice')} and ${linux('bob')}`), [1]);
});

const BS = String.fromCharCode(92);

test('paths in other spellings are found: JSON-escaped, lowercase, a file URL, under WSL, after other punctuation', () => {
  assert.deepEqual(lines(`C:${BS}${BS}Users${BS}${BS}carol${BS}${BS}x`), [1]);
  assert.deepEqual(lines(`c:${BS}users${BS}alice`), [1]);
  assert.deepEqual(lines(linux('alice').toUpperCase()), [1]);
  assert.deepEqual(lines(`file://${linux('alice')}`), [1]);
  assert.deepEqual(lines(`/mnt/c/${'Users'}/${'alice'}/x`), [1]);
  for (const before of [',', ';', '|', '>', '{', '<', '[']) assert.deepEqual(lines(`x${before}${linux('alice')}`), [1], before);
});

test('shared folders and the usual container and CI users are not a person', () => {
  for (const text of ['/Users/Shared/x', '/Users/Public', linux('ubuntu'), linux('node'), linux('vscode'), linux('root'), linux('ec2-user'), linux('vagrant')]) {
    assert.deepEqual(lines(text), [], text);
  }
});
