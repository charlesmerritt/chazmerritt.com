This is my new minimalist website which hosts my portfolio/CV and other things.

## Writing a post

1. Write the post as plain Markdown in `posts/<slug>.md` (no front matter, no title heading — the page renders those). Put images in `posts/images/` and reference them as `/posts/images/<file>`.
2. Add an entry to `data/writings.json` with `slug`, `title`, `date` (`YYYY-MM-DD`), `summary`, and `tags`.

The post shows up at `/writings.html?post=<slug>`, rendered in the browser by the vendored [marked](https://github.com/markedjs/marked) in `assets/js/vendor/`.

## Changing JS or CSS

Cloudflare tells browsers to cache `.js` and `.css` for 4 hours, so after editing `assets/js/main.js` or `assets/css/style.css`, bump the `?v=` on their `<script>`/`<link>` tags in every `.html` page (e.g. `?v=20261014` → today's date). Otherwise returning visitors keep running the old files against the new data.

## Project Status (auto-generated 2026-07-01)

**Git status:** On `main`, clean, fully in sync with `origin/main`. Last commit 3 weeks ago ("update job title"). Has a GitHub Actions deploy workflow.

**Maturity:** Mature for its scope — small static site (HTML pages + JSON-driven content in `data/`), clean tree, automated deploy.

**Low-hanging fruit:**
- No obvious low-hanging fruit identified — clean, deployed, and low-maintenance by design.
