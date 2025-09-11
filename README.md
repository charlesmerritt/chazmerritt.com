This is my new minimalist website which hosts my portfolio/CV and other things.

## Notes on Medium integration
This uses the public rss2json endpoint client-side for convenience. It may rate-limit or be blocked by CORS. If unreliable, consider:
- Using a serverless function to fetch Medium RSS and return JSON to the browser.
- Or simply linking to your Medium profile from the Writings page.
