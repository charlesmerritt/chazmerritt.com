#!/usr/bin/env node
// Build the gate page: encrypt a game HTML file and inject the ciphertext
// into scripts/gate-template.html, writing the result to --out.
//
//   LOVESICK_PASSPHRASE='strong words' \
//     node scripts/encrypt-lovesick.mjs --in ../lovesick/lovesick.html --out lovesick/index.html

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { encryptText } from '../lovesick/crypto-core.js';

const here = dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const inPath = arg('in');
const outPath = arg('out');
const passphrase = arg('pass') ?? process.env.LOVESICK_PASSPHRASE;

if (!inPath || !outPath) {
  console.error('Usage: node scripts/encrypt-lovesick.mjs --in <game.html> --out <gate.html> [--pass <passphrase>]');
  process.exit(1);
}
if (!passphrase) {
  console.error('Missing passphrase: pass --pass <value> or set LOVESICK_PASSPHRASE.');
  process.exit(1);
}

const gameHtml = await readFile(resolve(process.cwd(), inPath), 'utf8');
const template = await readFile(resolve(here, 'gate-template.html'), 'utf8');

const payload = await encryptText(gameHtml, passphrase);
const gate = template.replace('__LOVESICK_PAYLOAD__', () => JSON.stringify(payload));

if (gate.includes('__LOVESICK_PAYLOAD__')) {
  console.error('Template token not replaced — aborting.');
  process.exit(1);
}

await writeFile(resolve(process.cwd(), outPath), gate, 'utf8');
console.error(`Wrote ${outPath} (encrypted ${gameHtml.length} bytes of game HTML).`);
