# Lovesick on chazmerritt.com — Password-Gated Hidden Game

**Date:** 2026-06-30
**Status:** Approved design, pre-implementation
**Repo:** `chazmerritt.com` (implementation target)
**Source of game:** `~/projects/lovesick` (private repo)

## Goal

Attach the `lovesick` browser game to `chazmerritt.com`, hidden behind a password
so casual visitors don't find it and the game's secret (an OpenRouter API key) is
not exposed. The password gate is themed: a stylized chest with a golden heart
padlock that visibly unlocks when the correct passphrase is entered.

## Non-Goals

- No backend / server-side proxy (explicitly rejected as too complex for this game).
- No changes to the droplet's web-server config or the existing deploy workflow.
- No real/polished art in this pass — chest, padlock, and key are placeholder
  shapes with clearly marked `TODO: real art` hooks.
- No changes to the game's own logic beyond what's needed to host it.

## Threat Model — What's Actually Protected

The only secret is the OpenRouter API key, currently in `lovesick.html` as
`<meta name="openrouter-api-key" content="…">` and read at runtime by
`assets/js/lovesick.js` (line ~29), which calls `https://openrouter.ai/...`
directly from the browser (line ~1235).

- **Protected:** the game's HTML document (which carries the key) is encrypted at
  build time. The gate page ships only ciphertext. Without the passphrase, the
  key and the playable entry point cannot be recovered. The encryption — not the
  visible UI or an obscure URL — is the real lock.
- **Not protected (acceptable):** the bulky static assets (`js`, `css`, `img`,
  `mp3`) ship as plain files. They contain no secret, and a raw asset fetch does
  not let anyone obtain the key or actually play. Encrypting megabytes of audio
  would be pointless.
- **Residual risk:** the encrypted blob is offline-bruteforceable, so the
  passphrase must be strong. Mitigated further by key rotation + spend cap (below).

## Required Pre-Work (Key Hygiene)

1. **Rotate** the OpenRouter API key — the existing one has lived in git and is
   about to be deployed (encrypted, but still). Generate a fresh key.
2. **Set a hard spend cap** on the new key in the OpenRouter dashboard so any
   worst-case exposure is bounded.
3. Use the **rotated** key as the value embedded in the game HTML that gets
   encrypted. The plaintext key never enters the `chazmerritt.com` repo.

## Architecture

### File layout (in `chazmerritt.com`)

```
chazmerritt.com/
├── lovesick/
│   ├── index.html          # GATE: chest UI markup + embedded ciphertext (salt/iv/data)
│   ├── gate.css            # chest/padlock/key styling + unlock animation (placeholder art)
│   ├── gate.js             # derive key, decrypt, animate, mount game iframe (no secrets)
│   └── assets/             # copied as-is from lovesick repo
│       ├── js/lovesick.js
│       ├── css/lovesick.css
│       ├── img/ …
│       └── mp3/ …
├── scripts/
│   └── encrypt-lovesick.mjs  # build tool: game HTML + passphrase -> ciphertext into index.html
├── docs/superpowers/specs/2026-06-30-lovesick-on-site-design.md
└── …existing site untouched…
```

- Served at `/lovesick/`. Not linked from any nav. (Path is guessable; the
  encryption is the gate, so path obscurity is secondary.)
- Existing site pages (`index.html`, `projects.html`, `gallery.html`,
  `writings.html`, their `assets/`, `data/`) are untouched.

### Components & responsibilities

1. **`scripts/encrypt-lovesick.mjs`** — build/encrypt tool.
   - Input: path to the game HTML (with the rotated key) + a passphrase.
   - Output: `lovesick/index.html` with the chest markup and the embedded
     `salt`, `iv`, `ciphertext`.
   - Pure crypto around the Node Web Crypto API (`globalThis.crypto.subtle`,
     available in the installed Node v24). Zero dependencies, ESM.
   - Testable in isolation via an encrypt→decrypt round-trip.

2. **`lovesick/index.html`** (generated) — the gate page. Contains:
   - The chest + heart-padlock + input markup (placeholder art).
   - The embedded ciphertext (`salt`, `iv`, `data` as base64) as a JSON object in
     a single `<script type="application/json" id="lovesick-payload">` element.
   - A `<script src="gate.js">` reference. No secrets, no plaintext game.

3. **`lovesick/gate.js`** — runtime unlock logic (not secret):
   - On submit: PBKDF2 derive AES key from passphrase + salt; AES-GCM decrypt.
   - Failure (GCM auth tag mismatch / thrown error) → wrong-key animation, clear field.
   - Success → play unlock animation → mount decrypted game HTML in an iframe.

4. **`lovesick/gate.css`** — chest/padlock/key visuals + animation states
   (placeholder shapes; real art swapped in later).

5. **`lovesick/assets/*`** — the game's own files, copied verbatim from the
   `lovesick` repo. No edits.

### Crypto parameters (concrete, to avoid ambiguity)

- KDF: **PBKDF2-SHA256**, **250,000** iterations.
- Salt: **16 random bytes** (per build).
- Cipher: **AES-GCM, 256-bit** key.
- IV: **12 random bytes** (per build).
- Password-correctness check: the **AES-GCM authentication tag** (no separate
  HMAC). A wrong passphrase makes `decrypt` reject.
- Encoding: `salt`, `iv`, `ciphertext` stored as **base64** in `index.html`.
- The same parameter constants are shared between `encrypt-lovesick.mjs` and
  `gate.js` so they cannot drift.

### Data flow

```
passphrase
  → gate.js: PBKDF2(passphrase, salt) → AES-GCM key
  → AES-GCM decrypt(embedded ciphertext) → game HTML string
  → <iframe srcdoc="…game HTML…">  (base URL = /lovesick/index.html)
  → game JS reads key from in-DOM <meta>, calls OpenRouter directly
```

The decrypted key exists only in the iframe's in-memory DOM — never as a
fetchable file on the server.

### Why an iframe `srcdoc`

The game HTML references its assets with **relative** paths
(`assets/js/lovesick.js`, `assets/css/lovesick.css`, etc.). An iframe created via
`srcdoc` resolves relative URLs against the parent document's URL
(`/lovesick/index.html`), so those paths correctly map to `/lovesick/assets/…`.
This requires no rewriting of the game's markup.

## Unlock UX

`index.html` shows **only** the chest with the golden heart padlock and a text
field — nothing else, no game visible in the DOM.

- **Wrong passphrase:** padlock shakes, field clears, subtle inline error.
- **Correct passphrase:** a key descends, slots into the padlock, it clicks open,
  the chest opens, then a cross-fade reveals the mounted game iframe.

All art is placeholder (CSS-drawn shapes / simple elements) with `TODO: real art`
markers. The animation hooks and state transitions are real and final; only the
visuals are swappable.

## Build & Deploy

- Build command (run locally, not in CI):
  `node scripts/encrypt-lovesick.mjs --in <game.html> --pass <passphrase> --out lovesick/index.html`
  (passphrase may also be supplied via an env var to avoid shell history).
- The generated `lovesick/index.html` (ciphertext only) **is** committed. The
  plaintext game HTML with the key is **not** committed to this repo.
- Deploy is unchanged: the existing GitHub Action rsyncs the repo to the droplet
  and flips the `current` symlink. No web-server config changes.

## Testing / Verification

- **Automated (Node):** round-trip test — encrypt a known input, then decrypt
  with the correct passphrase and assert the output equals the original
  byte-for-byte; assert a wrong passphrase throws. This is the high-value test
  and runs without a browser.
- **Manual (browser):** load `/lovesick/` (or a local static serve), confirm:
  wrong passphrase → shake + no game in DOM; correct passphrase → unlock
  animation → game loads and is playable, including the ghost feature reaching
  OpenRouter with the rotated key.

## Known Pre-Existing Behavior (out of scope)

- The jukebox fetches a directory listing at `assets/mp3/jukebox/`
  (`lovesick.js:1351,1418`). That subdirectory does not currently exist and the
  feature already degrades to "No songs found". This is unchanged by this work;
  not fixed here.

## Assumptions

- Passphrase is chosen by the user at build time and stored nowhere in the repo.
- Path `/lovesick/`, no nav link from the rest of the site.
- Exactly one secret (the API key); all other assets are public.
- Node v24 (with global Web Crypto) is available for the build script.
