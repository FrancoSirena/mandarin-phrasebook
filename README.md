# Mandarin Travel Phrasebook

A free, single-page **Next.js** app that helps English-speaking travellers practise
Mandarin before and during a trip to **Chengdu**, **Shangri-La (Diqing)**, and
**Lijiang** — plus **Everyday Essentials**, **Hotel Check-in**, and a bonus
**Shenzhen / Huaqiangbei** tech-market category.

Every phrase has two actions:

- **🔊 Speak** — plays a high-quality, pre-recorded Chinese clip for each phrase.
  Audio is generated once from native macOS voices, stored on the server, and
  served as static files. You can switch between **four voices** (including a
  male voice) and adjust the 🐢 speed slider (0.5×–1.0×).
- **🎤 Practise** — records your voice via the microphone, transcribes what you
  said, and scores how close you were to the target phrase.

There is **no paid API key**. Speak uses server-stored audio; Practise uses the
Web Speech API (or a local Whisper model).

---

## Features

- **119 phrases** across eight categories: Respectful Basics, Everyday
  Essentials, At the Restaurant, Hotel Check-in, Chengdu / Sichuan,
  Shangri-La (Diqing), Lijiang (Naxi Cuisine), and Shenzhen Tech Market
  (Huaqiangbei).
- **Server-stored, high-quality audio** — every phrase is pre-recorded with
  native macOS Chinese voices and served from the server (fast + CDN-cached),
  so it sounds far better than a browser's built-in text-to-speech and works
  identically on every device, including iPhone.
- **🔊 Voice picker** with four voices: Sandy, Shelley, Ting-Ting (default), and
  Eddy (male).
- **🐢 Speed slider** (0.5×–1.0×, default 1.0×) to slow the speech further to
  your pace — persisted in `localStorage`.
- **"Sounds like" phonetic line** under each pinyin (e.g. 你好 → _nee how_).
- **Practise** with live microphone transcription and an approximate
  character-overlap score (0–100) plus friendly feedback bands.
- **📴 Offline recognition** — a local Whisper model that runs entirely in your
  browser: no Google, no VPN, and it works offline after a one-time ~40 MB
  download. It auto-falls back when the online engine is unreachable.
- **🔊 Hear what you said** — replay your own recording to compare it against
  the model voice.
- **Inline, non-blocking notices**, live search, dark mode, accessible markup,
  and print-friendly styles.

> **Note on the added categories.** The Shenzhen / Huaqiangbei, Everyday
> Essentials, and Hotel Check-in phrases were added on request and are **not**
> part of the original verbatim dataset. Please have a native speaker review
> them before relying on them.

---

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

> ⚠️ Speech recognition needs a microphone, an internet connection, and a
> browser that supports the Web Speech API (Chrome/Edge for the online engine).
> Speak works fully offline (audio is bundled in the repo) and on iPhone.

---

## Regenerating the audio

The phrase audio is generated from this Mac's native voices and committed to
`public/audio/`. To regenerate it (after adding/changing phrases or voices):

```bash
npm run generate-audio          # skips files that already exist
npm run generate-audio -- --force
```

The voice list lives in `scripts/generate-audio.mjs` (the `VOICES` array). Add
or remove entries there and rerun. It writes:

- `public/audio/<voice>/<hash>.m4a` — one AAC clip per phrase per voice
- `lib/audio-map.js` — the `VOICES` list + `zh → filename` lookup

> **Note:** there is no macOS voice named "Yu-shu" on this MacBook; the
> available Chinese (Mainland) voices are Ting-Ting plus the neural Sandy,
> Shelley, Eddy, Reed, Rocko, and Flo. If you install a different voice in
> System Settings → Accessibility → Spoken Content → Voices, add its exact name
> to the `VOICES` array and regenerate.

---

## Deployment

### Vercel (recommended)

Next.js deploys natively to Vercel:

1. Push the repo to GitHub (already done).
2. Go to **https://vercel.com → Add New → Project** and import the repo.
3. Vercel auto-detects Next.js — no build configuration needed.
4. Deploy. Every push to `main` redeploys automatically.

The audio in `public/audio/` is served from Vercel's CDN, and `/api/voices`
exposes the available voices.

### Netlify

Netlify can also run Next.js via its Next.js runtime (add the
`@netlify/plugin-nextjs` plugin). Vercel is the simplest path.

---

## Browser support

| Browser                 | 🔊 Speak                          | 🎤 Practise (online)                                | 🎤 Practise (offline, local)          |
| ----------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------- |
| Chrome / Edge (desktop) | ✅ Server audio                   | ✅ Best (needs Google reachable)                     | ✅ (first use downloads ~40 MB)        |
| Chrome / Edge (Android) | ✅ Server audio                   | ✅ (needs internet)                                  | ✅ (first use downloads ~40 MB)        |
| Safari (macOS / iOS)    | ✅ Server audio (works!)          | ⚠️ Partial — `webkitSpeechRecognition` on iOS 14.5+ | ✅ (first use downloads ~40 MB)        |
| Firefox                 | ✅ Server audio                   | ❌ Not supported                                      | ✅ (local model)                       |

Speak plays bundled server audio, so it works everywhere (including iPhone).
Practise uses the **online** engine when available and automatically falls back
to the **offline (local Whisper)** engine otherwise.

---

## No API keys needed

- **Bundled audio files** (`.m4a`, generated once with native macOS voices) for
  Speak — no API, no runtime network call for the audio itself.
- `window.SpeechRecognition` (or `webkitSpeechRecognition`) for online
  transcription.
- **Whisper** (via `@huggingface/transformers`) running locally in the browser
  for the offline engine. The ~40 MB model is downloaded once from Hugging Face
  and cached.

No Google Cloud, Azure, or OpenAI keys, no analytics, no cookies.

---

## Project structure

```
mandarin-phrasebook/
├── app/
│   ├── layout.jsx              # root layout (loads practice/offline classic scripts)
│   ├── page.jsx                # renders <Phrasebook />
│   ├── globals.css             # all styling (light/dark, print)
│   └── api/
│       └── voices/route.js     # GET /api/voices → available voices
├── components/
│   └── Phrasebook.jsx          # the client UI (render, search, speak, practise)
├── lib/
│   ├── data.js                 # CATEGORIES + PHRASES (119 phrases)
│   └── audio-map.js            # AUTO-GENERATED: VOICES + zh → filename
├── public/
│   ├── audio/<voice>/<hash>.m4a  # pre-recorded phrase audio (server-stored)
│   └── js/
│       ├── practice.js         # online recognition wrapper + scoring
│       └── offline.js          # local Whisper recognition wrapper
├── scripts/
│   └── generate-audio.mjs      # generates public/audio + lib/audio-map.js
├── next.config.mjs
├── jsconfig.json
├── package.json
└── README.md
```

---

## Decisions & trade-offs

- **Server-stored audio instead of browser TTS.** iOS Safari's
  `speechSynthesis` is unreliable (utterances can be garbage-collected or
  silently fail) and sounds robotic. We pre-record every phrase with native
  macOS voices and serve the clips from the server, which sounds far better and
  works identically everywhere.
- **Multiple voices.** The user can pick from four voices; the list is data in
  `scripts/generate-audio.mjs` and can be extended.
- **`practice.js` / `offline.js` stay as classic scripts** (loaded via
  `next/script` rather than bundled). This keeps the remote `import()` of
  transformers.js working and keeps those modules DOM-free.
- **All user-derived text uses `textContent`** (React escapes by default), so
  microphone transcripts can't inject markup.
- **One recognition at a time.** Starting a new card's Practise aborts any
  running recognition.
- **No external fonts.** The site loads with zero third-party requests; the
  offline engine lazily downloads transformers.js + the Whisper model on first
  use.

## Known limitations

- **Mobile Safari (iOS).** Speak works reliably (server audio). Speech
  recognition is only partially available (`webkitSpeechRecognition` on iOS
  14.5+) and may fail silently or require a network connection; the site
  degrades to a friendly notice.
- **Offline engine size & first run.** The local Whisper model is ~40 MB and
  downloads the first time you use offline Practise; transcription is slower
  than the online engine (a few seconds on WASM).
- **Offline accuracy.** `whisper-tiny` is small, so it may mis-hear rare words
  or names. The score remains a rough guide.
- **Online recognition.** `SpeechRecognition` sends audio to the browser
  vendor's servers, so online Practise needs an internet connection (and Google
  reachable for Chrome).
- **Tone-blind scoring.** The multiset character overlap does not evaluate
  tones, so it can't tell `mā` from `mà`. Use Speak to model tones.
