# Personal CV Site

Minimal static site for hosting your CV, projects, and writings.

## Edit your content
- Edit CV: `data/cv.json`
- Edit Projects: `data/projects.json`
- Edit Non-academic Writings: `data/writings.json`
- Configure Medium: set `mediumHandle` in `data/config.json`

## Local preview
You can open `index.html` directly in a browser. For Medium RSS to work and to avoid CORS on some assets, use a simple local server:

Python 3:
```
python -m http.server 8000
```
Then visit http://localhost:8000/

## 5-second summary overlay
- On the home page, a summary overlay shows for up to 5 seconds. Click "Enter" to dismiss immediately.
- Edit the summary line by changing the paragraph inside `index.html` or wire it from `data/cv.json` if preferred.

## Deployment
Upload the folder to any static host (Netlify, GitHub Pages, Vercel static, S3).

## Notes on Medium integration
This uses the public rss2json endpoint client-side for convenience. It may rate-limit or be blocked by CORS. If unreliable, consider:
- Using a serverless function to fetch Medium RSS and return JSON to the browser.
- Or simply linking to your Medium profile from the Writings page.
