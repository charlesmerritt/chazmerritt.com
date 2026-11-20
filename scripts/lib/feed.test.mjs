import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFeed } from './feed.mjs';

const SITE = { url: 'https://chazmerritt.com', title: 'Chaz Merritt — Writings', description: 'Posts.' };
const posts = [
  { slug: 'newer', title: 'Newer & better', date: '2026-05-28', summary: 'A <b>bold</b> claim.', tags: ['a'] },
  { slug: 'older', title: 'Older', date: '2023-10-19', summary: '', tags: [] },
];

test('feed is RSS 2.0 with a self link', () => {
  const xml = buildFeed(posts, SITE);
  assert.match(xml, /^<\?xml version="1.0" encoding="utf-8"\?>\n<rss version="2.0"/);
  assert.match(xml, /<atom:link href="https:\/\/chazmerritt.com\/feed.xml" rel="self" type="application\/rss\+xml"\/>/);
});

test('one item per post, in the given order, linking to the post page', () => {
  const xml = buildFeed(posts, SITE, { postUrl: slug => `https://chazmerritt.com/p/${slug}` });
  const links = [...xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map(m => m[1]);
  assert.deepEqual(links, ['https://chazmerritt.com/p/newer', 'https://chazmerritt.com/p/older']);
});

test('dates are RFC 822 and the channel date is the newest post', () => {
  const xml = buildFeed(posts, SITE);
  assert.match(xml, /<pubDate>Thu, 28 May 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<lastBuildDate>Thu, 28 May 2026 12:00:00 GMT<\/lastBuildDate>/);
});

test('text is XML-escaped', () => {
  const xml = buildFeed(posts, SITE);
  assert.match(xml, /<title>Newer &amp; better<\/title>/);
  assert.match(xml, /<description>A &lt;b&gt;bold&lt;\/b&gt; claim.<\/description>/);
  assert.match(xml, /<category>a<\/category>/);
});

test('an empty blog still yields a valid channel', () => {
  const xml = buildFeed([], SITE);
  assert.match(xml, /<channel>[\s\S]*<\/channel>/);
  assert.doesNotMatch(xml, /<item>|lastBuildDate/);
});

test('channel and default post links use extensionless URLs, as Cloudflare serves them', () => {
  const xml = buildFeed(posts, SITE);
  assert.match(xml, /<channel>\n    <title>[^<]*<\/title>\n    <link>https:\/\/chazmerritt.com\/writings<\/link>/);
  assert.match(xml, /<link>https:\/\/chazmerritt.com\/writings\?post=newer<\/link>/);
});
