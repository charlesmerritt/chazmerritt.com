# Lovesick — hidden, password-gated game

The game lives at `/lovesick/`. It is **not linked** from the site. `index.html`
is a generated "gate" page: it contains only an unlock UI plus the game's HTML
encrypted (AES-GCM, key derived from the passphrase via PBKDF2). Enter the
passphrase → the browser decrypts and runs the game in an iframe. The OpenRouter
API key is inside the encrypted blob and is never served in plaintext.

## Build the production gate (do this to deploy or update)

1. **Rotate the OpenRouter key** and set a hard spend cap on the new key. Put the
   new key in `~/projects/lovesick/lovesick.html` (`<meta name="openrouter-api-key">`).
2. Generate the gate with your real passphrase (kept out of shell history):

   ```bash
   read -rs LOVESICK_PASSPHRASE; export LOVESICK_PASSPHRASE
   node scripts/encrypt-lovesick.mjs --in ~/projects/lovesick/lovesick.html --out lovesick/index.html
   unset LOVESICK_PASSPHRASE
   ```

3. If the game's assets changed, re-copy them: `cp -R ~/projects/lovesick/assets/. lovesick/assets/`

   > **Note:** the source repo's `assets/mp3/f-sharp string loop.mp4` is 172MB (contains a video track) — over GitHub's 100MB push limit. The vendored copy here was remuxed to audio-only (26MB). If you re-copy assets, re-strip that file before committing (`python3 scripts/strip-video-track.py ~/projects/lovesick/assets/mp3/f-sharp\ string\ loop.mp4 lovesick/assets/mp3/f-sharp\ string\ loop.mp4` — zero-dependency, verifies audio bytes are untouched) or exclude it from the copy, or the push will fail.

4. Commit `lovesick/index.html` (+ any asset changes) and push — the existing
   GitHub Action rsyncs it to the droplet. No server config changes.

> **Never commit a gate built with a throwaway/known passphrase.** The blob is
> offline-bruteforceable, so use a strong passphrase.

## Tests

```bash
node --test scripts/test-crypto.mjs scripts/test-build.mjs   # crypto round-trip + build pipeline
```

## Local preview

```bash
node scripts/encrypt-lovesick.mjs --in ~/projects/lovesick/lovesick.html --out lovesick/index.html --pass test
python3 -m http.server 8000   # then open http://localhost:8000/lovesick/  (passphrase: test)
rm -f lovesick/index.html     # don't commit the throwaway build
```
