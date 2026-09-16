import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decryptText } from '../lovesick/crypto-core.js';

const run = promisify(execFile);

test('build embeds a payload that decrypts back to the input game HTML', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lovesick-'));
  try {
    const inFile = join(dir, 'game.html');
    const outFile = join(dir, 'index.html');
    const game = '<!DOCTYPE html><html><head><meta name="k" content="DUMMY"></head><body>game</body></html>';
    await writeFile(inFile, game, 'utf8');

    await run('node', ['scripts/encrypt-lovesick.mjs', '--in', inFile, '--out', outFile, '--pass', 'pw'], { cwd: process.cwd() });

    const html = await readFile(outFile, 'utf8');
    const m = html.match(/<script type="application\/json" id="lovesick-payload">(.+?)<\/script>/s);
    assert.ok(m, 'payload script element present');
    const payload = JSON.parse(m[1]);
    assert.equal(await decryptText(payload, 'pw'), game);
    assert.ok(!html.includes('__LOVESICK_PAYLOAD__'), 'token fully replaced');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('build exits non-zero when passphrase is missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lovesick-'));
  try {
    const inFile = join(dir, 'game.html');
    await writeFile(inFile, '<html></html>', 'utf8');
    await assert.rejects(
      run('node', ['scripts/encrypt-lovesick.mjs', '--in', inFile, '--out', join(dir, 'o.html')],
        { cwd: process.cwd(), env: { ...process.env, LOVESICK_PASSPHRASE: '' } })
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
