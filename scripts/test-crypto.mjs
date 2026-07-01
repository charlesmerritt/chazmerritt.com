import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptText, decryptText, PBKDF2_ITERATIONS } from '../lovesick/crypto-core.js';

test('round-trip with correct passphrase returns original text', async () => {
  const original = '<!DOCTYPE html><html>secret 💌 café</html>';
  const payload = await encryptText(original, 'correct horse battery staple');
  const out = await decryptText(payload, 'correct horse battery staple');
  assert.equal(out, original);
});

test('wrong passphrase rejects', async () => {
  const payload = await encryptText('hello', 'right-pass');
  await assert.rejects(() => decryptText(payload, 'wrong-pass'));
});

test('payload fields are base64 and iterations are pinned', async () => {
  const payload = await encryptText('x', 'p');
  for (const k of ['salt', 'iv', 'data']) {
    assert.match(payload[k], /^[A-Za-z0-9+/]+={0,2}$/, `${k} is base64`);
  }
  assert.equal(PBKDF2_ITERATIONS, 250000);
});
