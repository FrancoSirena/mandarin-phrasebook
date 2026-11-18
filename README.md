# Mandarin Travel Phrasebook

A free, 100% static, single-page website that helps English-speaking travellers
practise Mandarin before and during a trip to **Chengdu**, **Shangri-La
(Diqing)**, and **Lijiang** — plus **Everyday Essentials** and a bonus
**Shenzhen / Huaqiangbei** tech-market category.

Every phrase has two actions:

- **🔊 Speak** — reads the Chinese aloud with the browser's built-in
  text-to-speech (`zh-CN`, with an adjustable 🐢 speed slider from 0.5× to 1.0×).
- **🎤 Practise** — records your voice via the microphone, transcribes what you
  said, and scores how close you were to the target phrase.

There is **no backend, no build step, and no paid API key**. All speech
processing happens in your browser using the Web Speech API.

---

## Features

- **87 phrases** across seven categories: Respectful Basics, Everyday
  Essentials, At the Restaurant, Chengdu / Sichuan, Shangri-La (Diqing),
  Lijiang (Naxi Cuisine), and Shenzhen Tech Market (Huaqiangbei).
- **Speak** with automatic best-Chinese-voice selection (prefers `zh-CN` over
  `zh-TW`/`zh-HK`, re-resolves when voices load asynchronously), plus a **🔊
  Voice picker** so you can choose the least-robotic voice on your device.
- **🐢 Speed slider** (0.5×–1.0×, default 0.8×) to slow the speech down to your
  pace — persisted in `localStorage`.
- **"Sounds like" phonetic line** under each pinyin (e.g. 你好 → _nee how_), an
  English-friendly pronunciation hint added on request.
- **Practise** with live microphone transcription and an approximate
  character-overlap score (0–100) plus friendly feedback bands.
- **📴 Offline recognition** — a local Whisper model that runs entirely in your
  browser: no Google, no VPN, and it works offline after a one-time ~40 MB
  download. It auto-falls back when the online engine is unreachable.
- **🔊 Hear what you said** — after a practise attempt you can replay your own
  recording to compare it against the model voice.
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

> **Note on the added categories.** The Shenzhen / Huaqiangbei and Everyday
> Essentials phrases were added on request and are **not** part of the original
> verbatim dataset. They follow the same `{ zh, pinyin, phonetic, en, note }`
> shape, but please have a native speaker review them before relying on them.

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

| Browser                 | 🔊 Speak (TTS)                           | 🎤 Practise (online)                                | 🎤 Practise (offline, local)          |
| ----------------------- | ---------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| Chrome / Edge (desktop) | ✅ Best — picks a Chinese voice           | ✅ Best (needs Google reachable)                     | ✅ (first use downloads ~40 MB)        |
| Chrome / Edge (Android) | ✅                                       | ✅ (needs internet)                                  | ✅ (first use downloads ~40 MB)        |
| Safari (macOS / iOS)    | ✅ System voices (Chinese voice may vary) | ⚠️ Partial — `webkitSpeechRecognition` on iOS 14.5+ | ✅ (first use downloads ~40 MB)        |
| Firefox                 | ✅ (voice availability varies by OS)      | ❌ Not supported                                      | ✅ (local model)                       |

The page feature-detects everything and degrades gracefully. Practise uses the
**online** engine when available, and automatically falls back to the **offline
(local Whisper) engine** when it's not (e.g. in mainland China, or offline).
The Speak button stays usable wherever TTS is available.

---

## No API keys needed

This site uses only free, in-browser speech technology:

- `window.speechSynthesis` for text-to-speech.
- `window.SpeechRecognition` (or `webkitSpeechRecognition`) for online
  transcription.
- **Whisper** (via `@huggingface/transformers`) running locally in the browser
  for the offline engine. The ~40 MB model is downloaded once from Hugging Face
  and cached, then recognition works offline.

There are no Google Cloud, Azure, or OpenAI keys, no server, no analytics, and
no cookies. The site loads with zero third-party requests; the offline engine
only downloads its library + model the first time you use it.

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
│       ├── data.js             # CATEGORIES + PHRASES (87 phrases)
│       ├── speech.js           # TTS wrapper (voice selection, speak/cancel)
│       ├── practice.js         # online recognition wrapper + scoring
│       └── offline.js          # local Whisper recognition wrapper
├── sw.js                       # service worker (offline caching)
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
- **System font stack only.** No external fonts. The site loads with zero
  third-party requests; the offline engine lazily downloads transformers.js +
  the Whisper model on first use, then caches them (service worker + Cache API)
  so recognition works offline after that.
- **No `console.log`** in shipped code; genuine errors are surfaced through the
  inline result boxes instead.

## Known limitations

- **Mobile Safari (iOS).** Text-to-speech works but Chinese voice availability
  and quality vary by device/region. Speech recognition is only partially
  available (`webkitSpeechRecognition` on iOS 14.5+) and may fail silently or
  require a network connection; the site degrades to a friendly notice rather
  than crashing.
- **Offline engine size & first run.** The local Whisper model is ~40 MB and
  downloads the first time you use offline Practise; transcription is slower
  than the online engine (a few seconds on WASM).
- **Offline accuracy.** `whisper-tiny` is small, so it may mis-hear rare words
  or names (e.g. "Nixi", "Guoben"). The score remains a rough guide.
- **Online recognition.** `SpeechRecognition` sends audio to the browser
  vendor's servers, so online Practise needs an internet connection (and Google
  reachable for Chrome). Text-to-speech does not.
- **Tone-blind scoring.** The multiset character overlap does not evaluate
  tones, so it can't tell `mā` from `mà`. Use Speak to model tones.
- **Voice list timing.** Chrome loads voices asynchronously; the site
  re-resolves on `voiceschanged`, but the very first utterance may briefly use
  the browser default before a Chinese voice is cached.
