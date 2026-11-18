# Mandarin Travel Phrasebook

A free, 100% static, single-page website that helps English-speaking travellers
practise Mandarin before and during a trip to **Chengdu**, **Shangri-La
(Diqing)**, and **Lijiang** — plus a bonus **Shenzhen / Huaqiangbei**
tech-market category.

Every phrase has two actions:

- **🔊 Speak** — reads the Chinese aloud with the browser's built-in
  text-to-speech (`zh-CN`, with an adjustable 🐢 speed slider from 0.5× to 1.0×).
- **🎤 Practise** — records your voice via the microphone, transcribes what you
  said, and scores how close you were to the target phrase.

There is **no backend, no build step, and no paid API key**. All speech
processing happens in your browser using the Web Speech API.

---

## Features

- **66 phrases** across six categories: Respectful Basics, At the Restaurant,
  Chengdu / Sichuan, Shangri-La (Diqing), Lijiang (Naxi Cuisine), and Shenzhen
  Tech Market (Huaqiangbei).
- **Speak** with automatic best-Chinese-voice selection (prefers `zh-CN` over
  `zh-TW`/`zh-HK`, re-resolves when voices load asynchronously).
- **🐢 Speed slider** (0.5×–1.0×, default 0.8×) to slow the speech down to your
  pace — persisted in `localStorage`.
- **"Sounds like" phonetic line** under each pinyin (e.g. 你好 → _nee how_), an
  English-friendly pronunciation hint added on request.
- **Practise** with live microphone transcription and an approximate
  character-overlap score (0–100) plus friendly feedback bands.
- **Inline, non-blocking notices** when either speech API is unsupported —
  never an `alert()`.
- **Live search** that filters all cards across categories by Chinese, pinyin,
  or English (case-insensitive substring), hides empty categories, and shows a
  "no matches" state.
- **Dark mode** that follows `prefers-color-scheme` via CSS custom properties.
- **Accessible**: descriptive `aria-label`s, `aria-pressed` on the mic button,
  `role="status"`/`aria-live="polite"` result boxes, visible focus rings, full
  keyboard navigation, and `prefers-reduced-motion` support.
- **No layout shift** when results appear (animated height), and zero
  third-party network requests at runtime.
- **Print-friendly** stylesheet (`@media print`) for exporting the phrase list.

> **Note on the Shenzhen category.** The 21 Shenzhen / Huaqiangbei phrases were
> added on request for a separate mini-PC-buying playbook and are **not** part
> of the original verbatim dataset. They follow the same `{ zh, pinyin,
> phonetic, en, note }` shape, but please have a native speaker review them
> before relying on them.

### Screenshots

> _Placeholder — add screenshots here after deploying._

```
┌─────────────────────────────────────────────┐
│              (screenshot: light)            │
│              (screenshot: dark)             │
└─────────────────────────────────────────────┘
```

---

## Local development

No install is required. Two options:

### Option 1 — just open the file

Open `index.html` directly in your browser (double-click it, or
`open index.html` on macOS). Because the site is written as classic scripts
with relative asset paths, everything renders from `file://`.

> ⚠️ Speech recognition still needs an internet connection and a browser that
> supports the Web Speech API (Chrome/Edge). Text-to-speech works offline once
> the browser has its system voices.

### Option 2 — local static server (recommended for testing mic features)

Some browsers request microphone permission more reliably over `http(s)` than
over `file://`.

```bash
# from inside the project folder
npx serve .
# or, using the package.json script:
npm run serve
```

Then open the printed URL (usually `http://localhost:3000`).

---

## Deployment

### GitHub Pages (default)

1. Push this repository to GitHub.
2. Ensure your default branch is `main` (or edit `.github/workflows/deploy.yml`).
3. Go to **Settings → Pages** and set the source to **GitHub Actions**.

The workflow at `.github/workflows/deploy.yml` runs on every push to `main`,
uploads the repo root as the Pages artifact, and deploys it. It uses the
required `contents: read`, `pages: write`, and `id-token: write` permissions and
a `pages` concurrency group.

All asset paths are **relative** (no leading `/`), so the site also works from a
project subpath such as `https://<user>.github.io/mandarin-phrasebook/`.

### Cloudflare Pages / Netlify / Vercel

Point the platform at the repo root. There is no build command; the output
directory is the repo root (`.`).

---

## Browser support

| Browser                 | 🔊 Speak (TTS)                              | 🎤 Practise (recognition)                                   |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Chrome / Edge (desktop) | ✅ Best — picks a Chinese voice              | ✅ Best results                                              |
| Chrome / Edge (Android) | ✅                                          | ✅ (needs an internet connection)                            |
| Safari (macOS / iOS)    | ✅ System voices (Chinese voice may vary)    | ⚠️ Partial — `webkitSpeechRecognition` on iOS 14.5+; may be unavailable/limited on some setups |
| Firefox                 | ✅ (voice availability varies by OS)         | ❌ Not supported — Practise shows an inline notice           |

The page feature-detects both APIs and degrades gracefully: if an API is
missing, the matching buttons are disabled and a non-blocking notice explains
that Chrome or Edge gives the best results. The Speak button stays usable
wherever TTS is available.

---

## No API keys needed

This site uses only the **Web Speech API**, which is built into the browser:

- `window.speechSynthesis` for text-to-speech.
- `window.SpeechRecognition` (or `webkitSpeechRecognition`) for transcription.

There are no Google Cloud, Azure, or OpenAI keys, no server, no analytics, no
cookies, and no third-party network requests at runtime. It is free to host
anywhere that serves static files.

---

## Scoring is approximate

The practise score is a lightweight heuristic, not a pronunciation expert. It
compares the transcript from your microphone against the target phrase as a
**multiset of characters** (ignoring spaces and punctuation):

- Exact match → **100**.
- Otherwise it counts how many of the target's characters appear in what you
  said (each character used once) and reports that as a percentage.

This rewards saying the right characters and is useful for drills, but it does
**not** judge tones, word order, or accent. For example, saying the right
syllables in the wrong order can still score well. Treat the score as a rough
guide and lean on the **Speak** button to model correct pronunciation.

---

## Project structure

```
mandarin-phrasebook/
├── index.html                  # single page shell + relative asset links
├── assets/
│   ├── css/styles.css          # all styling, light/dark themes, print
│   └── js/
│       ├── app.js              # bootstrap, rendering, wiring (entry)
│       ├── data.js             # CATEGORIES + PHRASES (66 phrases)
│       ├── speech.js           # TTS wrapper (voice selection, speak/cancel)
│       └── practice.js         # recognition wrapper + scoring
├── .github/workflows/deploy.yml
├── .gitignore
├── LICENSE                     # MIT
├── package.json                # optional: `npm run serve` convenience script
└── README.md
```

---

## Decisions & trade-offs

- **Classic scripts instead of ES modules.** ES module `import`s are blocked by
  CORS when `index.html` is opened via `file://` in Chrome, Edge, and Firefox.
  Because "opening index.html directly from disk" is a hard requirement, the
  four JS files are classic scripts that attach to a single `window.Phrasebook`
  namespace, loaded in dependency order. The code is still modular — one
  concern per file — with a single global.
- **`speech.js` / `practice.js` are DOM-free.** They only manage API state and
  take callbacks, so `app.js` is the only file that touches the DOM.
- **All user-derived text uses `textContent`.** Microphone transcripts are
  never injected with `innerHTML`, which prevents script injection from the
  speech recogniser.
- **Animated result boxes instead of reserved space.** Reserving a fixed slot
  per card would waste ~45 slots of whitespace; a `grid-template-rows: 0fr → 1fr`
  transition expands results smoothly without a sudden layout shift.
- **One recognition at a time.** Starting a new card's Practise aborts any
  running recognition; `onend` is the single cleanup path that deletes the
  recogniser from the active map and resets the button.
- **System font stack only.** No external fonts, so the site makes zero
  third-party network requests and works offline (except recognition).
- **No `console.log`** in shipped code; genuine errors are surfaced through the
  inline result boxes instead.

## Known limitations

- **Mobile Safari (iOS).** Text-to-speech works but Chinese voice availability
  and quality vary by device/region. Speech recognition is only partially
  available (`webkitSpeechRecognition` on iOS 14.5+) and may fail silently or
  require a network connection; the site degrades to a friendly notice rather
  than crashing.
- **Offline recognition.** `SpeechRecognition` sends audio to the browser
  vendor's servers in most browsers, so Practise needs an internet connection.
  Text-to-speech does not.
- **Tone-blind scoring.** The multiset character overlap does not evaluate
  tones, so it can't tell `mā` from `mà`. Use Speak to model tones.
- **Voice list timing.** Chrome loads voices asynchronously; the site
  re-resolves on `voiceschanged`, but the very first utterance may briefly use
  the browser default before a Chinese voice is cached.
