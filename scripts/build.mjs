#!/usr/bin/env node
/*
 * Copy the public files (see lib/public-files.mjs) into dist/ for Cloudflare
 * Pages to deploy, so README, scripts/, .githooks/, and Markdown sources
 * (including drafts) aren't served.
 *
 *   npm run build
 *
 * Cloudflare Pages settings: build command `npm run build`, output directory `dist`.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublic, listFiles } from './lib/public-files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const all = await listFiles(ROOT);
const files = all.filter(isPublic);

await rm(DIST, { recursive: true, force: true });
for (const file of files) {
  await mkdir(path.dirname(path.join(DIST, file)), { recursive: true });
  await cp(path.join(ROOT, file), path.join(DIST, file));
}
console.log(`dist/: ${files.length} of ${all.length} files`);
