import { readdir } from 'node:fs/promises';
import path from 'node:path';

/*
 * Which repo files the deployed site serves. An allowlist, so a new tooling
 * file or a draft post stays private unless a rule here names it.
 */
const PUBLIC = [
  /^[^/]+\.html$/,                      // top-level pages, 404.html
  /^(robots\.txt|favicon\.ico|site\.webmanifest|feed\.xml|sitemap\.xml)$/,
  /^assets\//,
  /^data\/[^/]+\.json$/,
  /^posts\/[^/]+\.html$/,               // pre-rendered published posts, never the .md sources
  /^posts\/images\//,
];

export function isPublic(file) {
  return PUBLIC.some(rule => rule.test(file));
}

// Walk the tree rather than asking git, so builds don't depend on .git being present
export async function listFiles(root, dir = '') {
  const out = [];
  for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!['.git', 'dist', 'node_modules'].includes(entry.name)) out.push(...await listFiles(root, rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}
