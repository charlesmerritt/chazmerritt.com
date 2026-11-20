#!/usr/bin/env node
/*
 * Local tooling for the Markdown blog. Node built-ins only, so the deployed
 * site still needs no build step.
 *
 *   node scripts/blog.mjs new "Post title"   scaffold posts/<slug>.md as a draft
 *   node scripts/blog.mjs dev [port]         preview server with drafts + live reload
 *   node scripts/blog.mjs index              regenerate the generated files below
 *   node scripts/blog.mjs check              pre-commit: are the staged copies current?
 *
 * Each post's metadata lives in its front matter. Generated from it, drafts
 * excluded, and committed (a static host can't list posts/ or run a build):
 *   data/writings.json   the Writings index the browser renders
 *   feed.xml             RSS feed
 *   sitemap.xml          every page and post, for search engines
 */
import { execFileSync } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFeed } from './lib/feed.mjs';
import { buildSitemap } from './lib/sitemap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const INDEX_REL = 'data/writings.json';
const SITE = {
  url: 'https://chazmerritt.com',
  title: 'Chaz Merritt — Writings',
  description: 'Writing by Chaz Merritt on research, forestry, machine learning, and more.',
};
// Top-level pages, as their canonical URLs. Add new pages here so they reach the sitemap.
const PAGES = ['/', '/projects.html', '/writings.html', '/gallery.html'];
const postUrl = slug => `${SITE.url}/writings.html?post=${encodeURIComponent(slug)}`;

/* Front matter: a deliberately small YAML subset (key: value, [a, b] lists, true/false) */
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function parseValue(raw) {
  const v = raw.trim();
  if (v === 'true' || v === 'false') return v === 'true';
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map(parseValue).filter(s => s !== '');
  }
  if (v.startsWith('"') && v.endsWith('"')) return JSON.parse(v);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function parseFrontMatter(text) {
  const match = text.match(FRONT_MATTER);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 1 || line.trimStart().startsWith('#')) continue;
    data[line.slice(0, i).trim()] = parseValue(line.slice(i + 1));
  }
  return data;
}

function today() {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}

/* Index: one entry per post, newest first. Drafts only when previewing. */
async function buildIndex({ drafts = false } = {}) {
  const entries = [];
  const errors = [];
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md')).sort();
  for (const file of files) {
    const slug = file.slice(0, -3);
    let meta;
    try {
      meta = parseFrontMatter(await readFile(path.join(POSTS_DIR, file), 'utf8'));
    } catch (e) {
      errors.push(`posts/${file}: can't parse front matter (${e.message})`);
      continue;
    }
    const isDraft = meta.draft === true;
    if (isDraft && !drafts) continue;
    if (!isDraft) {
      if (typeof meta.title !== 'string' || !meta.title) errors.push(`posts/${file}: missing title`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || '')) errors.push(`posts/${file}: date must be YYYY-MM-DD`);
    }
    const entry = {
      slug,
      title: meta.title || slug,
      date: meta.date || today(),
      summary: meta.summary || '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
    };
    if (isDraft) entry.draft = true;
    entries.push(entry);
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return { entries, json: JSON.stringify(entries, null, 2) + '\n', count: entries.length, errors };
}

/* Every committed file generated from posts/, as { rel: content } */
async function buildOutputs() {
  const { entries, json, count, errors } = await buildIndex();
  const files = {
    [INDEX_REL]: json,
    'feed.xml': buildFeed(entries, SITE, { postUrl }),
    'sitemap.xml': buildSitemap([
      ...PAGES.map(page => ({ loc: SITE.url + page })),
      ...entries.map(post => ({ loc: postUrl(post.slug), lastmod: post.date })),
    ]),
  };
  return { files, count, errors };
}

async function writeOutputs() {
  const { files, count, errors } = await buildOutputs();
  const changed = [];
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(ROOT, rel);
    const current = existsSync(file) ? await readFile(file, 'utf8') : '';
    if (content !== current) {
      await writeFile(file, content);
      changed.push(rel);
    }
  }
  return { changed, count, errors };
}

/* Commands */
async function cmdNew(title) {
  if (!title) fail('Usage: npm run new -- "Post title"');
  const slug = title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) fail(`Can't make a filename out of "${title}"`);
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (existsSync(file)) fail(`posts/${slug}.md already exists`);
  await writeFile(file, [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${today()}`,
    'summary: ""',
    'tags: []',
    'draft: true',
    '---',
    '',
    '',
  ].join('\n'));
  console.log(`Created posts/${slug}.md (draft)`);
  console.log(`Preview: npm run dev, then open /writings.html?post=${slug}`);
  console.log('Publish: remove "draft: true", set the date, and commit.');
}

async function cmdIndex() {
  const { changed, count, errors } = await writeOutputs();
  errors.forEach(e => console.error(`✗ ${e}`));
  console.log(`${count} published post${count === 1 ? '' : 's'}; ${changed.length ? `updated ${changed.join(', ')}` : 'generated files unchanged'}`);
  if (errors.length) process.exit(1);
}

function stagedCopy(rel) {
  try {
    return execFileSync('git', ['show', `:${rel}`], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return '';
  }
}

async function cmdCheck() {
  const { files, errors } = await buildOutputs();
  if (errors.length) {
    errors.forEach(e => console.error(`✗ ${e}`));
    process.exit(1);
  }
  const stale = Object.keys(files).filter(rel => files[rel] !== stagedCopy(rel));
  if (stale.length) {
    console.error(`✗ ${stale.join(', ')} ${stale.length === 1 ? "doesn't" : "don't"} match posts/. Run:\n\n    npm run index && git add ${stale.join(' ')}\n`);
    process.exit(1);
  }
}

/* Dev server: mirrors Cloudflare Pages (pretty URLs, 404.html), never caches */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};
const RELOAD_SNIPPET = '<script>new EventSource("/__reload").onmessage = () => location.reload();</script>';

async function resolveFile(pathname) {
  if (pathname.split('/').some(part => part.startsWith('.'))) return null;
  const candidates = pathname.endsWith('/') ? [`${pathname}index.html`] : [pathname, `${pathname}.html`];
  for (const candidate of candidates) {
    const file = path.join(ROOT, candidate);
    if (!file.startsWith(ROOT + path.sep)) return null;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {}
  }
  return null;
}

function send(res, status, ext, body) {
  if (ext === '.html') body = String(body).replace('</body>', `${RELOAD_SNIPPET}</body>`);
  res.writeHead(status, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
}

// One plain watcher per directory: Node's { recursive: true } on Linux misses deletions.
// Directories created after startup aren't watched until the server restarts.
async function watchTree(dir, onChange) {
  watch(dir, (_event, name) => name && onChange(path.relative(ROOT, path.join(dir, String(name)))));
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      await watchTree(path.join(dir, entry.name), onChange);
    }
  }
}

async function cmdDev(port = 8000) {
  const clients = new Set();

  const server = http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname === '/__reload') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
        res.write(': connected\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      if (pathname === `/${INDEX_REL}`) {
        const { json, errors } = await buildIndex({ drafts: true });
        errors.forEach(e => console.warn(`✗ ${e}`));
        return send(res, 200, '.json', json);
      }
      const file = await resolveFile(decodeURIComponent(pathname));
      if (file) return send(res, 200, path.extname(file), await readFile(file));
      send(res, 404, '.html', await readFile(path.join(ROOT, '404.html')));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  });

  // Keep the committed generated files in sync while writing, then reload open tabs
  const generated = new Set(Object.keys((await buildOutputs()).files).map(rel => path.normalize(rel)));
  let timer;
  await watchTree(ROOT, filename => {
    if (generated.has(filename) || filename.split(path.sep).some(p => p.startsWith('.'))) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const { changed, errors } = await writeOutputs();
      if (changed.length) console.log(`Updated ${changed.join(', ')}`);
      errors.forEach(e => console.warn(`✗ ${e}`));
      for (const client of clients) client.write('data: reload\n\n');
    }, 150);
  });

  await writeOutputs();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Previewing at http://localhost:${port}/writings.html (drafts included, reloads on save)`);
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
const commands = {
  new: () => cmdNew(args.join(' ').trim()),
  dev: () => cmdDev(Number(args[0] || process.env.PORT) || 8000),
  index: cmdIndex,
  check: cmdCheck,
};
if (!commands[command]) fail('Usage: node scripts/blog.mjs <new "Title" | dev [port] | index | check>');
await commands[command]();
