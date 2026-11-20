import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPostDate, renderPostPage } from './post-page.mjs';

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Writings — Chaz Merritt</title>
  <meta name="description" content="Writings and essays" />
  <meta property="og:title" content="Writings — Chaz Merritt" />
  <meta property="og:description" content="Selected writings." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://chazmerritt.com/writings" />
  <link rel="canonical" href="https://chazmerritt.com/writings" />
  <meta name="twitter:title" content="Writings — Chaz Merritt" />
  <meta name="twitter:description" content="Selected writings." />
</head>
<body data-page="writings">
  <nav><a href="/writings">Writings</a></nav>
  <main id="main" class="container">
    <section id="writings-index">index</section>
    <article id="post" class="post" hidden></article>
  </main>
  <footer class="footer"><div id="footer-links"></div></footer>
  <script src="/assets/js/vendor/marked.umd.js" defer></script>
  <script src="/assets/js/main.js?v=1" defer></script>
</body>
</html>
`;
const post = { slug: 'tea', title: 'Tea & "Toast"', date: '2026-05-28', summary: 'On <breakfast>.', tags: [] };
const page = () => renderPostPage({
  shell,
  post,
  bodyHtml: '<p>Hello <img src="images/a.jpg"></p>',
  url: 'https://chazmerritt.com/posts/tea',
});

test('head describes the post, escaped, with its own URL', () => {
  const html = page();
  assert.match(html, /<title>Tea &amp; &quot;Toast&quot; — Chaz Merritt<\/title>/);
  assert.match(html, /<meta name="description" content="On &lt;breakfast&gt;\." \/>/);
  assert.match(html, /<meta property="og:title" content="Tea &amp; &quot;Toast&quot;" \/>/);
  assert.match(html, /<meta name="twitter:description" content="On &lt;breakfast&gt;\." \/>/);
  assert.match(html, /<meta property="og:type" content="article" \/>/);
  assert.match(html, /<meta property="article:published_time" content="2026-05-28" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/chazmerritt.com\/posts\/tea" \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/chazmerritt.com\/posts\/tea" \/>/);
  assert.doesNotMatch(html, /chazmerritt.com\/writings"/);
});

test('main holds the rendered article; the index and marked are gone', () => {
  const html = page();
  assert.match(html, /<body data-page="post">/);
  assert.match(html, /<main id="main" class="container">\n    <article id="post" class="post">/);
  assert.match(html, /<h1>Tea &amp; &quot;Toast&quot;<\/h1>/);
  assert.match(html, /<p class="post-subtitle">On &lt;breakfast&gt;\.<\/p>/);
  assert.match(html, /<div class="meta"><time datetime="2026-05-28">May 28, 2026<\/time><\/div>/);
  assert.match(html, /<div class="post-body">\n<p>Hello <img src="images\/a.jpg"><\/p>\n<\/div>/);
  assert.doesNotMatch(html, /writings-index|marked\.umd/);
});

test('nav, footer, and scripts carry over from the shell', () => {
  const html = page();
  assert.match(html, /<nav><a href="\/writings">Writings<\/a><\/nav>/);
  assert.match(html, /<div id="footer-links"><\/div>/);
  assert.match(html, /<script src="\/assets\/js\/main.js\?v=1" defer><\/script>/);
});

test('a shell missing an expected tag is an error, not a silently wrong page', () => {
  assert.throws(() => renderPostPage({ shell: '<html></html>', post, bodyHtml: '', url: 'x' }), /writings\.html/);
});

test('dates format the same in every timezone', () => {
  assert.equal(formatPostDate('2023-10-19'), 'October 19, 2023');
});
