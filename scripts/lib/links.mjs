/* Pure helpers for scripts/linkcheck.mjs: find links in a file, resolve them, judge responses. */
import path from 'node:path';

export const SITE_ORIGIN = 'https://chazmerritt.com';

const SKIP = /^(mailto:|tel:|data:|javascript:|#)|\$\{/;
const TAG = /<[a-z][^>]*>/gi;
const ATTR = /\b(?:href|src)\s*=\s*"([^"]*)"/g;
// Resource hints name an origin to warm up, not a page anyone visits
const HINT = /\brel="(?:preconnect|dns-prefetch)"/;
const XML_LINK = /<(?:loc|link)>([^<]+)<\/(?:loc|link)>/g;
const JSON_STRING = /"((?:[^"\\]|\\.)*)"/g;
// A JSON value counts as a link if it's absolute, root-relative, or a relative path to a file
const LINKISH = /^(https?:\/\/\S+|\/\S*|[\w.-]+\/[\w./-]*\.\w+(?:[?#]\S*)?)$/;

const decodeEntities = text => text
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function extractLinks(text, ext) {
  let found = [];
  if (ext === '.html') {
    found = (text.match(TAG) || []).filter(tag => !HINT.test(tag))
      .flatMap(tag => [...tag.matchAll(ATTR)].map(m => decodeEntities(m[1])));
  }
  else if (ext === '.xml') found = [...text.matchAll(XML_LINK)].map(m => decodeEntities(m[1]));
  else if (ext === '.json') found = [...text.matchAll(JSON_STRING)].map(m => JSON.parse(`"${m[1]}"`)).filter(v => LINKISH.test(v));
  return [...new Set(found.map(u => u.trim()).filter(u => u && !SKIP.test(u)))];
}

export function isExternal(url) {
  return /^https?:\/\//.test(url) && !url.startsWith(SITE_ORIGIN);
}

export function isPlaceholder(url) {
  return /PLACEHOLDER|0000-0000-0000-0000/i.test(url);
}

/** 'ok' | 'blocked' (the site refuses scripts; a person can still open it) | 'broken' */
export function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'ok';
  if ([401, 403, 429, 999].includes(status)) return 'blocked';
  return 'broken';
}

/** A request that never got a status: a dead host is broken; TLS trouble or a timeout needs a person. */
export function classifyError(code) {
  return ['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN', 'ECONNRESET'].includes(code) ? 'broken' : 'blocked';
}

/**
 * The repo file an internal link lands on, or null. Mirrors Cloudflare Pages:
 * the path as-is, then with .html, then as a directory's index.html.
 */
export function resolveInternal(url, fromFile, exists) {
  let target = url.startsWith(SITE_ORIGIN) ? url.slice(SITE_ORIGIN.length) || '/' : url;
  target = decodeURIComponent(target.split(/[?#]/)[0]);
  if (target === '') return fromFile;
  // Data files are read by pages at the root, so their relative paths resolve from there
  const base = fromFile.endsWith('.json') ? '.' : path.posix.dirname(fromFile);
  const joined = target.startsWith('/') ? target : `/${path.posix.join(base, target)}`;
  const clean = path.posix.normalize(joined).replace(/^\/+/, '');
  const candidates = clean === '' || joined.endsWith('/')
    ? [`${clean}${clean && !clean.endsWith('/') ? '/' : ''}index.html`]
    : [clean, `${clean}.html`, `${clean}/index.html`];
  return candidates.find(exists) ?? null;
}
