/* sitemaps.org XML sitemap. Pure: [{ loc, lastmod? }] in, XML string out. */
import { escapeXml } from './feed.mjs';

export function buildSitemap(urls) {
  const entries = urls.map(({ loc, lastmod }) => [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    '  </url>',
  ].filter(line => line !== null).join('\n'));
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}
