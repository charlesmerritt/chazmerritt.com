import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPublic } from './public-files.mjs';

test('pages, generated files, and assets are published', () => {
  for (const file of [
    'index.html', '404.html', 'robots.txt', 'favicon.ico', 'site.webmanifest', 'feed.xml', 'sitemap.xml',
    'assets/css/style.css', 'assets/pdf/cv.pdf', 'data/cv.json',
    'posts/latex-is-easier-than-you-think.html', 'posts/images/digging.jpg',
  ]) assert.equal(isPublic(file), true, file);
});

test('repo tooling and Markdown sources are not', () => {
  for (const file of [
    'README.md', 'package.json', '.gitignore', '.githooks/pre-commit',
    'scripts/blog.mjs', 'scripts/og/card.html', 'posts/a-draft.md', 'posts/published.md',
    'notes.txt', 'docs/plan.html',
  ]) assert.equal(isPublic(file), false, file);
});
