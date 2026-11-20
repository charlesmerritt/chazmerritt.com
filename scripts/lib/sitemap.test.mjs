import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSitemap } from './sitemap.mjs';

test('lists every URL in a urlset, with lastmod only when known', () => {
  const xml = buildSitemap([
    { loc: 'https://chazmerritt.com/' },
    { loc: 'https://chazmerritt.com/p/one', lastmod: '2026-05-28' },
  ]);
  assert.match(xml, /^<\?xml version="1.0" encoding="utf-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /<loc>https:\/\/chazmerritt.com\/<\/loc>/);
  assert.doesNotMatch(urls[0], /lastmod/);
  assert.match(urls[1], /<lastmod>2026-05-28<\/lastmod>/);
});

test('locations are XML-escaped', () => {
  const xml = buildSitemap([{ loc: 'https://chazmerritt.com/writings.html?post=a&b' }]);
  assert.match(xml, /<loc>https:\/\/chazmerritt.com\/writings.html\?post=a&amp;b<\/loc>/);
});
