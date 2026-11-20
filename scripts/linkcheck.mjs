#!/usr/bin/env node
/*
 * Check every link in the files the site publishes.
 *
 *   node scripts/linkcheck.mjs              internal links only (deterministic; CI on every push)
 *   node scripts/linkcheck.mjs --external   also fetch outside URLs (weekly in CI)
 *
 * Internal links must land on a published file (see lib/public-files.mjs), so a
 * link to something the build leaves out counts as broken. Outside sites that
 * refuse scripts (403, 429, LinkedIn's 999) or fail TLS checks are reported but
 * don't fail the run;
 * placeholder URLs fail it when --external is set.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyError, classifyStatus, extractLinks, isExternal, isPlaceholder, resolveInternal } from './lib/links.mjs';
import { isPublic, listFiles } from './lib/public-files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const external = process.argv.includes('--external');
const CHECKED = new Set(['.html', '.xml', '.json']);

const published = (await listFiles(ROOT)).filter(isPublic);
const exists = new Set(published);
const sources = new Map(); // url -> Set of files that use it
const broken = [];

for (const file of published.filter(f => CHECKED.has(path.extname(f)))) {
  const text = await readFile(path.join(ROOT, file), 'utf8');
  for (const url of extractLinks(text, path.extname(file))) {
    if (isExternal(url)) {
      if (!sources.has(url)) sources.set(url, new Set());
      sources.get(url).add(file);
    } else if (resolveInternal(url, file, f => exists.has(f)) === null) {
      broken.push({ url, where: [file], why: 'no such published file' });
    }
  }
}

const placeholders = [...sources.keys()].filter(isPlaceholder);
const blocked = [];

async function probe(url) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; site link check)' };
  const signal = () => AbortSignal.timeout(20_000);
  try {
    let res = await fetch(url, { method: 'HEAD', headers, signal: signal(), redirect: 'follow' });
    if (classifyStatus(res.status) !== 'ok') res = await fetch(url, { headers, signal: signal(), redirect: 'follow' });
    return res.status;
  } catch (e) {
    return e.cause?.code || e.name;
  }
}

if (external) {
  const queue = [...sources.keys()].filter(url => !isPlaceholder(url));
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const status = await probe(url);
      const kind = typeof status === 'number' ? classifyStatus(status) : classifyError(status);
      const entry = { url, where: [...sources.get(url)], why: String(status) };
      if (kind === 'broken') broken.push(entry);
      if (kind === 'blocked') blocked.push(entry);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
}

const show = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label}`);
  for (const { url, where, why } of list) console.log(`  ${why ? `[${why}] ` : ''}${url}\n      in ${where.join(', ')}`);
};
const where = url => ({ url, where: [...sources.get(url)] });

console.log(`${published.length} published files; ${sources.size} outside links${external ? ' checked' : ' (not fetched; pass --external)'}`);
show('✗ Broken:', broken);
show(`${external ? '✗' : '!'} Placeholders still to fill in:`, placeholders.map(where));
show('? Refused automated requests (open these by hand):', blocked);

const failed = broken.length > 0 || (external && placeholders.length > 0);
console.log(failed ? '\nLink check failed.' : '\nLink check passed.');
process.exit(failed ? 1 : 0);
