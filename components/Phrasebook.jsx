'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, PHRASES } from '@/lib/data';
import { VOICES, AUDIO } from '@/lib/audio-map';

const SPEED_KEY = 'mtp.speed.v3';
const OFFLINE_KEY = 'mtp.offline';
const VOICE_KEY = 'mtp.voice.v2';

const DEFAULT_VOICE = (VOICES.find((v) => v.default) || VOICES[0]).id;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function read(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function bandFor(score) {
  if (score === 100) return { tone: 'good', label: '🎉 Perfect!' };
  if (score >= 60) return { tone: 'good', label: '👍 Good — very close!' };
  if (score >= 30) return { tone: 'warn', label: '💪 Almost — keep trying' };
  return { tone: 'bad', label: '🔁 Not quite — listen again and retry' };
}

function describeError(type) {
  switch (type) {
    case 'not-allowed':
      return 'Microphone permission was denied. Tap the lock icon in the address bar, allow the microphone, and try again.';
    case 'no-speech':
      return 'Nothing was detected. Tap 🔊 Speak first to hear the model, then try again and speak clearly.';
    case 'audio-capture':
      return 'No microphone was found. Connect a microphone and try again.';
    case 'language-not-supported':
      return "This browser can't recognise Chinese speech. On iPhone, enable Dictation and add a Chinese keyboard — or turn on the 📴 Offline toggle.";
    case 'bad-grammar':
      return "The recogniser couldn't process that. Try again, or turn on the 📴 Offline toggle.";
    case 'start-failed':
      return "The microphone couldn't start. Tap Practise again.";
    case 'aborted':
      return 'Listening was interrupted.';
    case 'network':
      return "Speech recognition couldn't reach the browser's speech service. Switching to the local (offline) model.";
    case 'insecure-context':
      return 'The microphone needs a secure page. Use the https:// URL (or http://localhost) for offline recognition.';
    case 'offline-unsupported':
      return 'Local (offline) recognition is not supported in this browser. Use Chrome, Edge, or Safari.';
    case 'transcribe-failed':
      return 'Local recognition failed. If this is your first try, connect once to download the speech model (~40 MB); after that it works offline.';
    case 'unsupported':
      return 'Speech recognition is not supported in this browser. Use Chrome or Edge on desktop for the best results.';
    default:
      return 'Something went wrong while listening. Please try again.';
  }
}

export default function Phrasebook() {
  const [speed, setSpeed] = useState(() => {
    try {
      const v = parseFloat(window.localStorage.getItem(SPEED_KEY));
      return isFinite(v) ? clamp(v, 0.5, 1) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [voice, setVoice] = useState(() => read(VOICE_KEY, DEFAULT_VOICE));
  const [offline, setOffline] = useState(() => read(OFFLINE_KEY, '0') === '1');
  const [search, setSearch] = useState('');
  const [speakingKey, setSpeakingKey] = useState(null);
  const [listeningKey, setListeningKey] = useState(null);
  const [processingKey, setProcessingKey] = useState(null);
  const [results, setResults] = useState({});
  const [support, setSupport] = useState({ ready: false, online: false, offline: false });

  const audioRef = useRef(null);
  const practiceRef = useRef(null);

  // Persist preferences.
  useEffect(() => {
    try { window.localStorage.setItem(SPEED_KEY, String(speed)); } catch {}
  }, [speed]);
  useEffect(() => {
    try { window.localStorage.setItem(VOICE_KEY, voice); } catch {}
  }, [voice]);
  useEffect(() => {
    try { window.localStorage.setItem(OFFLINE_KEY, offline ? '1' : '0'); } catch {}
  }, [offline]);

  // Detect the recognition engines once practice.js / offline.js have loaded.
  useEffect(() => {
    const check = () => {
      const ns = window.Phrasebook || {};
      setSupport({
        ready: !!(ns.practice && ns.offline),
        online: !!(ns.practice && ns.practice.supported()),
        offline: !!(ns.offline && ns.offline.supported())
      });
    };
    check();
    const t = setInterval(check, 250);
    const stop = setTimeout(() => clearInterval(t), 5000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, []);

  const flat = useMemo(() => {
    const out = [];
    for (const cat of CATEGORIES) {
      (PHRASES[cat.id] || []).forEach((phrase, i) => {
        out.push({
          key: cat.id + '-' + i,
          category: cat,
          phrase,
          haystack: (phrase.zh + ' ' + phrase.pinyin + ' ' + (phrase.phonetic || '') + ' ' + phrase.en + ' ' + (phrase.note || '')).toLowerCase()
        });
      });
    }
    return out;
  }, []);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATEGORIES
      .map((cat) => ({
        cat,
        items: flat.filter((f) => f.category.id === cat.id && (!q || f.haystack.includes(q)))
      }))
      .filter((g) => g.items.length > 0);
  }, [flat, search]);

  function setResult(key, res) {
    setResults((prev) => {
      const old = prev[key];
      if (old && old.replayUrl && (!res || res.replayUrl !== old.replayUrl)) {
        try { URL.revokeObjectURL(old.replayUrl); } catch {}
      }
      return { ...prev, [key]: res };
    });
  }

  function resetBtn(key) {
    setListeningKey((k) => (k === key ? null : k));
    setProcessingKey((k) => (k === key ? null : k));
  }

  function fallbackSpeak(phrase) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase.zh);
    u.lang = 'zh-CN';
    u.rate = speed;
    const zh = window.speechSynthesis.getVoices().filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('zh'));
    if (zh.length) u.voice = zh[0];
    window.speechSynthesis.speak(u);
  }

  function handleSpeak(key, phrase) {
    const filename = AUDIO[phrase.zh];
    if (!filename) {
      fallbackSpeak(phrase);
      return;
    }

    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
    }
    const el = new Audio('/audio/' + voice + '/' + filename);
    audioRef.current = el;
    try { el.playbackRate = clamp(speed, 0.5, 1.25); } catch {}

    setSpeakingKey(key);
    el.onplaying = () => setSpeakingKey(key);
    el.onended = () => setSpeakingKey((k) => (k === key ? null : k));
    el.onerror = () => {
      setSpeakingKey((k) => (k === key ? null : k));
      fallbackSpeak(phrase);
    };
    el.play().catch(() => {
      setSpeakingKey((k) => (k === key ? null : k));
      fallbackSpeak(phrase);
    });
  }

  function resultForScore(phrase, heard, score, blob) {
    const band = bandFor(score);
    return {
      kind: 'result',
      tone: band.tone,
      label: band.label,
      score,
      heard,
      target: phrase.zh + ' (' + phrase.pinyin + ')',
      replayUrl: blob ? URL.createObjectURL(blob) : null
    };
  }

  function startOnline(key, phrase) {
    const practice = window.Phrasebook.practice;
    let settled = false;
    let failedOver = false;
    let audioBlob = null;

    const handle = practice.start({
      onStart: () => {},
      onResult: (heard) => {
        if (settled) return;
        settled = true;
        setResult(key, resultForScore(phrase, heard, practice.score(phrase.zh, heard), audioBlob));
        resetBtn(key);
      },
      onAudio: (blob) => {
        audioBlob = blob;
        if (settled && !failedOver) {
          setResult(key, (prev) => (prev && prev.kind === 'result' ? { ...prev, replayUrl: URL.createObjectURL(blob) } : prev));
        }
      },
      onError: (err) => {
        if (settled) return;
        const t = err && err.type;
        if (t === 'aborted') return;
        if (t !== 'not-allowed' && t !== 'audio-capture' && t !== 'no-speech') {
          settled = true;
          failedOver = true;
          setOffline(true);
          startOffline(key, phrase);
          return;
        }
        settled = true;
        setResult(key, { kind: 'error', message: describeError(t) });
        resetBtn(key);
      },
      onEnd: (info) => {
        if (settled) return;
        settled = true;
        resetBtn(key);
        if (!info.aborted && !info.hadResult) setResult(key, { kind: 'nospeech' });
      }
    });
    practiceRef.current = handle;
  }

  function startOffline(key, phrase) {
    const off = window.Phrasebook.offline;
    const practice = window.Phrasebook.practice;
    let settled = false;
    let audioBlob = null;

    const handle = off.start({
      onStart: () => {},
      onAudio: (blob) => { audioBlob = blob; },
      onTranscribing: () => {
        if (settled) return;
        setProcessingKey(key);
        setResult(key, { kind: 'processing', text: '🎧 Transcribing locally… (first time downloads ~40 MB)' });
      },
      onProgress: (fraction) => {
        if (settled) return;
        if (typeof fraction === 'number') {
          setResult(key, { kind: 'processing', text: '📥 Downloading speech model… ' + Math.round(fraction * 100) + '%' });
        }
      },
      onResult: (heard) => {
        if (settled) return;
        settled = true;
        setResult(key, resultForScore(phrase, heard, practice ? practice.score(phrase.zh, heard) : 0, audioBlob));
        resetBtn(key);
      },
      onError: (err) => {
        if (settled) return;
        settled = true;
        setResult(key, { kind: 'error', message: describeError(err && err.type) });
        resetBtn(key);
      },
      onEnd: (info) => {
        if (settled) return;
        settled = true;
        resetBtn(key);
        if (!info.aborted && !info.hadResult) setResult(key, { kind: 'nospeech' });
      }
    });
    practiceRef.current = handle;
  }

  function handlePractice(key, phrase) {
    const ns = window.Phrasebook || {};
    if (listeningKey === key || processingKey === key) {
      if (practiceRef.current) practiceRef.current.stop();
      return;
    }
    setListeningKey(key);
    setProcessingKey(null);
    setResult(key, null);

    const useOffline = offline || !(ns.practice && ns.practice.supported());
    if (useOffline) startOffline(key, phrase);
    else startOnline(key, phrase);
  }

  const notices = [];
  if (support.ready) {
    if (!support.online && !support.offline) {
      notices.push('🎤 Speech recognition is not available in this browser, so the Practise buttons are disabled. Use Chrome, Edge, or Safari.');
    } else if (!support.online && support.offline) {
      notices.push('🎤 This browser has no online speech recognition, so Practise uses the local (offline) model. The first use downloads ~40 MB, then it works offline.');
    }
  }

  const recognitionDisabled = support.ready && !support.online && !support.offline;

  return (
    <div className="container">
      <header className="site-header">
        <h1>Mandarin Travel Phrasebook</h1>
        <p className="subtitle">
          Practise essential Mandarin for a trip to Chengdu, Shangri-La (Diqing), and Lijiang — plus Shenzhen&apos;s Huaqiangbei
          electronics market. Tap <strong>🔊 Speak</strong> to hear a native-quality recording, then <strong>🎤 Practise</strong> and
          repeat it back — your browser listens, transcribes, and scores how close you were.
        </p>
      </header>

      {notices.length > 0 && (
        <div className="support-notices">
          {notices.map((n) => (
            <p key={n} className="support-notice">{n}</p>
          ))}
        </div>
      )}

      <section className="how-to" aria-label="How practising works">
        <p>
          <strong>🎙️ How practising works:</strong> speech recognition runs in your browser and works best in{' '}
          <strong>Chrome or Edge on desktop</strong> (it needs a microphone and an internet connection). For the best result, tap
          Speak first and listen carefully, then tap Practise and repeat the phrase.
        </p>
      </section>

      <div className="controls">
        <label className="search">
          <span className="visually-hidden">Search phrases</span>
          <input
            type="search"
            placeholder="Search Chinese, pinyin, or English…"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="speed-control">
          <span className="speed-control__label">🐢 Speed</span>
          <input
            id="speed-slider"
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={speed}
            aria-label="Speaking speed"
            onChange={(e) => setSpeed(clamp(parseFloat(e.target.value), 0.5, 1))}
          />
          <output htmlFor="speed-slider">{speed.toFixed(1)}×</output>
        </label>

        <label className="mode-toggle" title="Use local speech recognition (Whisper) instead of the browser's online service. First use downloads ~40 MB, then it works offline.">
          <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
          <span>📴 Offline</span>
        </label>

        <label className="voice-picker">
          <span className="voice-picker__label">🔊 Voice</span>
          <select aria-label="Chinese voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} — {v.description} ({v.gender})
              </option>
            ))}
          </select>
        </label>
      </div>

      <main>
        <div id="app">
          {grouped.map((g) => (
            <section key={g.cat.id} className="category">
              <h2 className="category__title">{g.cat.emoji} {g.cat.title}</h2>
              <p className="category__desc">{g.cat.description}</p>
              <div className="category__cards">
                {g.items.map(({ key, phrase }) => {
                  const res = results[key];
                  const isSpeaking = speakingKey === key;
                  const isListening = listeningKey === key;
                  const isProcessing = processingKey === key;

                  return (
                    <article key={key} className="phrase-card">
                      <div className="phrase-card__row">
                        <div className="phrase-card__text">
                          <div className="phrase-card__zh" lang="zh-CN">{phrase.zh}</div>
                          <div className="phrase-card__pinyin">{phrase.pinyin}</div>
                          {phrase.phonetic && <div className="phrase-card__phonetic">{phrase.phonetic}</div>}
                          <div className="phrase-card__en">{phrase.en}</div>
                          {phrase.note && <div className="phrase-card__note">{phrase.note}</div>}
                        </div>
                        <div className="phrase-card__actions">
                          <button
                            type="button"
                            className={'btn btn--speak' + (isSpeaking ? ' is-speaking' : '')}
                            aria-label={'Speak the phrase: ' + phrase.zh + ' (' + phrase.en + ')'}
                            onClick={() => handleSpeak(key, phrase)}
                          >
                            {isSpeaking ? '🔊 Speaking…' : '🔊 Speak'}
                          </button>
                          <button
                            type="button"
                            className={'btn btn--practice' + (isListening ? ' is-listening' : '')}
                            aria-pressed={isListening}
                            aria-label={'Practise saying: ' + phrase.zh + ' (' + phrase.en + ')'}
                            disabled={recognitionDisabled || isProcessing}
                            onClick={() => handlePractice(key, phrase)}
                          >
                            {isProcessing ? '🎤 Processing…' : isListening ? '🎤 Listening…' : '🎤 Practise'}
                          </button>
                        </div>
                      </div>

                      {res && (
                        <div
                          className={
                            'result-box is-visible' +
                            (res.tone ? ' result-box--' + res.tone : '') +
                            (res.kind === 'error' || res.kind === 'processing' || res.kind === 'nospeech' ? ' result-box--warn' : '')
                          }
                          role="status"
                          aria-live="polite"
                        >
                          <div className="result-box__inner">
                            {res.kind === 'result' && (
                              <>
                                <div className="result-box__label">{res.label}</div>
                                <div className="result-box__score">{res.score}%</div>
                                <div className="result-box__heard">You said: {res.heard}</div>
                                {res.score < 100 && <div className="result-box__target">Target: {res.target}</div>}
                                {res.replayUrl && (
                                  <button
                                    type="button"
                                    className="btn btn--replay"
                                    onClick={() => { try { new Audio(res.replayUrl).play(); } catch {} }}
                                  >
                                    🔊 Hear what you said
                                  </button>
                                )}
                              </>
                            )}
                            {res.kind === 'error' && <div className="result-box__label">⚠️ {res.message}</div>}
                            {res.kind === 'processing' && <div className="result-box__label">{res.text}</div>}
                            {res.kind === 'nospeech' && (
                              <div className="result-box__label">🎤 Nothing detected — tap 🔊 Speak first, then try again.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div id="no-matches" className="no-matches" hidden={grouped.length > 0}>
          No phrases match your search. Try a different word.
        </div>
      </main>

      <footer className="site-footer">
        <p>Mandarin Travel Phrasebook · no accounts, no tracking, no API keys. High-quality audio is served from the server.</p>
      </footer>
    </div>
  );
}
