This is my new minimalist website which hosts my portfolio/CV and other things.

## Writing a post

Needs Node; there are no dependencies to install.

1. `npm run new -- "Post title"` creates `posts/<slug>.md` as a draft.
2. `npm run dev` serves the site at http://localhost:8000 with drafts listed and the page reloading on every save. Write in your editor and watch it there.
3. Fill in the front matter as you go:

   ```yaml
   ---
   title: "Post title"
   date: 2026-10-14
   summary: "One line shown under the title and on the card."
   tags: [one, two]
   draft: true
   ---
   ```

   Don't repeat the title as a heading in the body; the page renders it. Put images in `posts/images/` and reference them relatively (`images/photo.jpg`), so they show in your editor's preview as well as on the site.
4. To publish, delete `draft: true`, set `date`, then commit `posts/` together with the generated files (below) and push.

Generated from the front matter of published posts, and committed because a static host can't list a folder or run a build:

- `data/writings.json`: the Writings index
- `feed.xml`: the RSS feed
- `sitemap.xml`: every page and post for search engines (add new top-level pages to `PAGES` in `scripts/blog.mjs`)
- `posts/<slug>.html`: each post pre-rendered into a copy of `writings.html`, served at `/posts/<slug>`, so search engines and link previews see the full text. Editing `writings.html` (even a `?v=` bump) changes them, so run `npm run index` afterwards.

`npm run dev` keeps them current, or run `npm run index`. Don't edit them by hand. A pre-commit hook in `.githooks/` stops a commit whose staged copies are stale; enable it once per clone with `git config core.hooksPath .githooks`. `npm test` runs the generators' tests.

Drafts never appear on the live site's list, but a committed draft's raw `.md` is still reachable by URL, so keep anything private uncommitted.

Published posts live at `/posts/<slug>`; old `/writings?post=<slug>` links forward there. Drafts have no static page and preview at `/writings?post=<slug>` under `npm run dev`. Both use the vendored [marked](https://github.com/markedjs/marked) in `assets/js/vendor/`.

## Deploying

`npm run build` copies only the public files into `dist/`, using the allowlist in `scripts/lib/public-files.mjs`: pages, `assets/`, `data/`, pre-rendered posts and their images, and the generated XML. The README, `scripts/`, `.githooks/`, `package.json`, and every `.md` post source, drafts included, stay out. A new kind of public file needs a rule there.

**One-time Cloudflare Pages setting** (Settings → Builds): build command `npm run build`, build output directory `dist`. Until that's set, Pages keeps serving the whole repo.

## Checks

- `npm test`: unit tests for the generators, link helpers, and publish allowlist
- `npm run links`: every internal link lands on a published file
- `npm run links -- --external`: also fetches outside links and fails on placeholder URLs

`.github/workflows/site.yml` runs the first two, the generated-files check, and the build on every push; outside links run weekly (and on demand from the Actions tab), since other sites' outages shouldn't fail a push.

## Changing JS or CSS

Cloudflare tells browsers to cache `.js` and `.css` for 4 hours, so after editing `assets/js/main.js` or `assets/css/style.css`, bump the `?v=` on their `<script>`/`<link>` tags in every `.html` page (e.g. `?v=20261014` → today's date). Otherwise returning visitors keep running the old files against the new data.

## Project Status (auto-generated 2026-07-01)

**Git status:** On `main`, clean, fully in sync with `origin/main`. Last commit 3 weeks ago ("update job title"). Has a GitHub Actions deploy workflow.

**Maturity:** Mature for its scope — small static site (HTML pages + JSON-driven content in `data/`), clean tree, automated deploy.

**Low-hanging fruit:**
- No obvious low-hanging fruit identified — clean, deployed, and low-maintenance by design.
