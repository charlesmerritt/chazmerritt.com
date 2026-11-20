/*
 * A post's static page, made from writings.html so the nav, footer, and asset
 * versions have one source. Pure: shell + post + rendered body in, HTML out.
 */

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPostDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

// Replace exactly one match, so a changed writings.html fails loudly instead of yielding a half-edited page
function replaceOnce(html, pattern, replacement, what) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g')) || [];
  if (matches.length !== 1) {
    throw new Error(`writings.html: expected one ${what}, found ${matches.length}`);
  }
  return html.replace(pattern, replacement);
}

function setMeta(html, attr, name, value) {
  const pattern = new RegExp(`<meta ${attr}="${name}" content="[^"]*" />`);
  return replaceOnce(html, pattern, () => `<meta ${attr}="${name}" content="${escapeHtml(value)}" />`, `${name} meta tag`);
}

/**
 * @param {{ shell: string, post: {slug, title, date, summary}, bodyHtml: string, url: string }} args
 */
export function renderPostPage({ shell, post, bodyHtml, url }) {
  const title = escapeHtml(post.title);
  const summary = post.summary || '';
  let html = shell;

  html = replaceOnce(html, /<title>[^<]*<\/title>/, () => `<title>${title} — Chaz Merritt</title>`, '<title>');
  html = setMeta(html, 'name', 'description', summary);
  html = setMeta(html, 'property', 'og:title', post.title);
  html = setMeta(html, 'property', 'og:description', summary);
  html = setMeta(html, 'name', 'twitter:title', post.title);
  html = setMeta(html, 'name', 'twitter:description', summary);
  html = setMeta(html, 'property', 'og:url', url);
  html = replaceOnce(html, /<meta property="og:type" content="[^"]*" \/>/,
    () => `<meta property="og:type" content="article" />\n  <meta property="article:published_time" content="${escapeHtml(post.date)}" />`,
    'og:type meta tag');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*" \/>/, () => `<link rel="canonical" href="${escapeHtml(url)}" />`, 'canonical link');
  html = replaceOnce(html, /<body data-page="writings">/, () => '<body data-page="post">', '<body data-page="writings">');

  const article = [
    '<main id="main" class="container">',
    '    <article id="post" class="post">',
    '      <a class="post-back" href="/writings">← All writings</a>',
    '      <header class="post-header">',
    `        <h1>${title}</h1>`,
    summary ? `        <p class="post-subtitle">${escapeHtml(summary)}</p>` : null,
    `        <div class="meta"><time datetime="${escapeHtml(post.date)}">${formatPostDate(post.date)}</time></div>`,
    '      </header>',
    `      <div class="post-body">\n${bodyHtml.trim()}\n</div>`,
    '    </article>',
    '  </main>',
  ].filter(line => line !== null).join('\n');
  html = replaceOnce(html, /<main id="main" class="container">[\s\S]*?<\/main>/, () => article, '<main>');
  // Posts arrive pre-rendered; the browser doesn't need the Markdown parser
  html = replaceOnce(html, /\s*<script src="\/assets\/js\/vendor\/marked\.umd\.js" defer><\/script>/, () => '', 'marked <script>');

  return html;
}
