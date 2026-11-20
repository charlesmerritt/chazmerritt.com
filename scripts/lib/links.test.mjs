import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyError, classifyStatus, extractLinks, isPlaceholder, resolveInternal } from './links.mjs';

test('html: href and src, skipping anchors, mailto, data, and JS templates', () => {
  const html = `<a href="/projects">P</a> <img src="images/a.jpg"> <a href="#top">t</a>
    <a href="mailto:x@y.z">m</a> <link rel="icon" href="data:image/svg+xml,x">
    <a href="https://example.org/x?a=1&amp;b=2">e</a> <a href="\${url}">tpl</a>`;
  assert.deepEqual(extractLinks(html, '.html').sort(), [
    '/projects', 'https://example.org/x?a=1&b=2', 'images/a.jpg',
  ]);
});

test('xml: loc and link elements', () => {
  const xml = '<url><loc>https://chazmerritt.com/</loc></url><link>https://chazmerritt.com/writings</link>';
  assert.deepEqual(extractLinks(xml, '.xml').sort(), ['https://chazmerritt.com/', 'https://chazmerritt.com/writings']);
});

test('json: string values that look like URLs or site paths', () => {
  const json = JSON.stringify({ link: 'https://doi.org/10.1/x', src: 'assets/gallery/a.jpg', usedOn: '/index.html#cv', title: 'Not/a link', none: '#', empty: '' });
  assert.deepEqual(extractLinks(json, '.json').sort(), ['/index.html#cv', 'assets/gallery/a.jpg', 'https://doi.org/10.1/x']);
});

test('statuses: success, bot-blocked, or broken', () => {
  assert.equal(classifyStatus(200), 'ok');
  assert.equal(classifyStatus(301), 'ok');
  for (const s of [401, 403, 429, 999]) assert.equal(classifyStatus(s), 'blocked', String(s));
  for (const s of [400, 404, 410, 500]) assert.equal(classifyStatus(s), 'broken', String(s));
});

test('placeholders are recognised', () => {
  assert.equal(isPlaceholder('https://scholar.google.com/citations?user=PLACEHOLDER'), true);
  assert.equal(isPlaceholder('https://orcid.org/0000-0000-0000-0000'), true);
  assert.equal(isPlaceholder('https://orcid.org/0000-0002-1825-0097'), false);
});

test('internal links resolve like Cloudflare Pages: as-is, then .html, then index.html', () => {
  const files = new Set(['index.html', 'projects.html', 'posts/a.html', 'posts/images/x.jpg', 'docs/index.html']);
  const exists = f => files.has(f);
  assert.equal(resolveInternal('/projects', 'index.html', exists), 'projects.html');
  assert.equal(resolveInternal('/projects.html?x=1#y', 'index.html', exists), 'projects.html');
  assert.equal(resolveInternal('/', 'index.html', exists), 'index.html');
  assert.equal(resolveInternal('/docs/', 'index.html', exists), 'docs/index.html');
  assert.equal(resolveInternal('images/x.jpg', 'posts/a.html', exists), 'posts/images/x.jpg');
  assert.equal(resolveInternal('https://chazmerritt.com/posts/a', 'sitemap.xml', exists), 'posts/a.html');
  assert.equal(resolveInternal('/missing', 'index.html', exists), null);
});

test('relative paths in JSON resolve from the site root, where pages use them', () => {
  const exists = f => f === 'assets/gallery/a.jpg';
  assert.equal(resolveInternal('assets/gallery/a.jpg', 'data/gallery.json', exists), 'assets/gallery/a.jpg');
});

test('resource hints are not links', () => {
  const html = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="dns-prefetch" href="https://x.org"><link rel="stylesheet" href="/a.css">';
  assert.deepEqual(extractLinks(html, '.html'), ['/a.css']);
});

test('network errors: dead hosts are broken, certificate trouble needs a person', () => {
  assert.equal(classifyError('ENOTFOUND'), 'broken');
  assert.equal(classifyError('ECONNREFUSED'), 'broken');
  assert.equal(classifyError('UNABLE_TO_VERIFY_LEAF_SIGNATURE'), 'blocked');
  assert.equal(classifyError('CERT_HAS_EXPIRED'), 'blocked');
  assert.equal(classifyError('TimeoutError'), 'blocked');
});
