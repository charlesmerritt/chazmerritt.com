/* RSS 2.0 feed for the Writings index. Pure: entries in, XML string out. */

export function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Posts carry a calendar date only; noon UTC keeps it on the same day in every timezone.
function rfc822(date) {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

const defaultPostUrl = site => slug => `${site.url}/writings.html?post=${encodeURIComponent(slug)}`;

/**
 * @param {Array<{slug, title, date, summary, tags}>} posts newest first
 * @param {{url, title, description}} site
 * @param {{postUrl?: (slug: string) => string}} options
 */
export function buildFeed(posts, site, { postUrl = defaultPostUrl(site) } = {}) {
  const items = posts.map(post => {
    const link = postUrl(post.slug);
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${rfc822(post.date)}</pubDate>`,
      post.summary ? `      <description>${escapeXml(post.summary)}</description>` : null,
      ...post.tags.map(tag => `      <category>${escapeXml(tag)}</category>`),
      '    </item>',
    ].filter(line => line !== null).join('\n');
  });

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(`${site.url}/writings.html`)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    '    <language>en-us</language>',
    `    <atom:link href="${escapeXml(`${site.url}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    posts.length ? `    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>` : null,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].filter(line => line !== null).join('\n');
}
