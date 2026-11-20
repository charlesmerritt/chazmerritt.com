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
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublic } from './lib/public-files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

// Walk the tree rather than asking git, so the build doesn't depend on .git being present
async function listFiles(dir = '') {
  const out = [];
  for (const entry of await readdir(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!['.git', 'dist', 'node_modules'].includes(entry.name)) out.push(...await listFiles(rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

const all = await listFiles();
const files = all.filter(isPublic);

await rm(DIST, { recursive: true, force: true });
for (const file of files) {
  await mkdir(path.dirname(path.join(DIST, file)), { recursive: true });
  await cp(path.join(ROOT, file), path.join(DIST, file));
}
console.log(`dist/: ${files.length} of ${all.length} files`);
