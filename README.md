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
4. To publish, delete `draft: true`, set `date`, then commit `posts/` together with `data/writings.json` and push.

`data/writings.json` is generated from the front matter of published posts (`npm run dev` keeps it current, or run `npm run index`), because a static host can't list a folder. Don't edit it by hand. A pre-commit hook in `.githooks/` stops a commit whose staged copy is stale; enable it once per clone with `git config core.hooksPath .githooks`.

Drafts never appear on the live site's list, but a committed draft's raw `.md` is still reachable by URL, so keep anything private uncommitted.

Posts render at `/writings.html?post=<slug>` in the browser via the vendored [marked](https://github.com/markedjs/marked) in `assets/js/vendor/`.

## Changing JS or CSS

Cloudflare tells browsers to cache `.js` and `.css` for 4 hours, so after editing `assets/js/main.js` or `assets/css/style.css`, bump the `?v=` on their `<script>`/`<link>` tags in every `.html` page (e.g. `?v=20261014` → today's date). Otherwise returning visitors keep running the old files against the new data.

## Project Status (auto-generated 2026-07-01)

**Git status:** On `main`, clean, fully in sync with `origin/main`. Last commit 3 weeks ago ("update job title"). Has a GitHub Actions deploy workflow.

**Maturity:** Mature for its scope — small static site (HTML pages + JSON-driven content in `data/`), clean tree, automated deploy.

**Low-hanging fruit:**
- No obvious low-hanging fruit identified — clean, deployed, and low-maintenance by design.
