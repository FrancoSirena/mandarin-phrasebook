/**
 * Mandarin Travel Phrasebook — entry module.
 *
 * Bootstraps the page: renders categories/cards, wires the Speak and Practise
 * buttons, the live search filter, the speed slider, offline recognition, and
 * the support notices. This is the only module that touches the DOM.
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook;
  var CATEGORIES = ns.CATEGORIES;
  var PHRASES = ns.PHRASES;
  var speech = ns.speech;
  var practice = ns.practice;
  var offline = ns.offline;

  var SPEED_KEY = 'mtp.speed';
  var DEFAULT_SPEED = 0.8;
  var MIN_SPEED = 0.5;
  var MAX_SPEED = 1.0;
  var OFFLINE_KEY = 'mtp.offline';
  var VOICE_KEY = 'mtp.voice';

  var state = {
    speed: readSpeedPref(),
    offline: readOfflinePref(),
    activePractice: null
  };

  // Registry of every rendered card, used for search and to reset other
  // listening buttons when a new card starts practising.
  var cardRegistry = [];

  /* ----------------------------- tiny DOM helpers ----------------------------- */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  // IMPORTANT: all user-derived text (speech transcripts) is inserted with
  // textContent — never innerHTML — so it cannot inject markup.
  function clampSpeed(v) {
    return Math.max(MIN_SPEED, Math.min(MAX_SPEED, v));
  }

  function readSpeedPref() {
    try {
      var v = parseFloat(localStorage.getItem(SPEED_KEY));
      if (isFinite(v)) return clampSpeed(v);
    } catch (e) { /* ignore */ }
    return DEFAULT_SPEED;
  }

  function writeSpeedPref(value) {
    try { localStorage.setItem(SPEED_KEY, String(value)); } catch (e) { /* private mode */ }
  }

  function readOfflinePref() {
    try { return localStorage.getItem(OFFLINE_KEY) === '1'; } catch (e) { return false; }
  }

  function writeOfflinePref(value) {
    try { localStorage.setItem(OFFLINE_KEY, value ? '1' : '0'); } catch (e) { /* private mode */ }
  }

  function readVoicePref() {
    try { return localStorage.getItem(VOICE_KEY) || null; } catch (e) { return null; }
  }

  function writeVoicePref(name) {
    try {
      if (name) localStorage.setItem(VOICE_KEY, name);
      else localStorage.removeItem(VOICE_KEY);
    } catch (e) { /* private mode */ }
  }

  /* ----------------------------- support notices ----------------------------- */

  function renderSupportNotices() {
    var container = document.getElementById('support-notices');
    container.replaceChildren();

    var notices = [];
    if (!speech.supported()) {
      notices.push('🔇 Text-to-speech is not available in this browser, so the Speak buttons are disabled. Try Chrome or Edge.');
    }
    if (!practice.supported() && !offline.supported()) {
      notices.push('🎤 Speech recognition is not available in this browser, so the Practise buttons are disabled. Use Chrome, Edge, or Safari.');
    } else if (!practice.supported()) {
      notices.push('🎤 This browser has no online speech recognition, so Practise uses the local (offline) model. The first use downloads ~40 MB, then it works offline.');
    }

    container.hidden = notices.length === 0;
    for (var i = 0; i < notices.length; i++) {
      var p = el('p', 'support-notice');
      p.textContent = notices[i];
      container.appendChild(p);
    }
  }

  /* ----------------------------- button state ----------------------------- */

  function setSpeaking(btn, active) {
    btn.classList.toggle('is-speaking', active);
    btn.textContent = active ? '🔊 Speaking…' : '🔊 Speak';
  }

  function setListening(btn, listening) {
    btn.setAttribute('aria-pressed', String(listening));
    btn.classList.toggle('is-listening', listening);
    btn.textContent = listening ? '🎤 Listening…' : '🎤 Practise';
  }

  function setProcessing(btn, processing) {
    btn.setAttribute('aria-pressed', 'false');
    btn.classList.remove('is-listening');
    btn.disabled = processing;
    btn.textContent = processing ? '🎤 Processing…' : '🎤 Practise';
  }

  function resetOtherPracticeButtons(currentBtn) {
    for (var i = 0; i < cardRegistry.length; i++) {
      var btn = cardRegistry[i].practiceBtn;
      if (btn !== currentBtn && btn.getAttribute('aria-pressed') === 'true') {
        setListening(btn, false);
      }
    }
  }

  /* ----------------------------- result rendering ----------------------------- */

  function bandFor(score) {
    if (score === 100) return { tone: 'good', label: '🎉 Perfect!' };
    if (score >= 60) return { tone: 'good', label: '👍 Good — very close!' };
    if (score >= 30) return { tone: 'warn', label: '💪 Almost — keep trying' };
    return { tone: 'bad', label: '🔁 Not quite — listen again and retry' };
  }

  function describeError(type) {
    switch (type) {
      case 'not-allowed':
        return 'Microphone permission was denied. Click the lock icon in the address bar, allow the microphone, and try again.';
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

  function clearResult(resultBox) {
    resultBox.className = 'result-box';
    resultBox.querySelector('.result-box__inner').replaceChildren();
  }

  function showResultBox(resultBox, tone) {
    resultBox.className = 'result-box is-visible result-box--' + tone;
  }

  function makeReplayButton(blob) {
    var url = URL.createObjectURL(blob);
    var btn = el('button', 'btn btn--replay');
    btn.type = 'button';
    btn.textContent = '🔊 Hear what you said';
    btn.setAttribute('aria-label', 'Play back your recording');
    btn.addEventListener('click', function () {
      var audio = new Audio(url);
      audio.play().catch(function () { /* non-fatal */ });
    });
    return btn;
  }

  function appendReplay(resultBox, blob) {
    var inner = resultBox.querySelector('.result-box__inner');
    inner.appendChild(makeReplayButton(blob));
  }

  function renderResult(resultBox, phrase, heard, score, audioBlob) {
    var band = bandFor(score);
    showResultBox(resultBox, band.tone);

    var inner = resultBox.querySelector('.result-box__inner');
    inner.replaceChildren();

    var label = el('div', 'result-box__label');
    label.textContent = band.label;

    var scoreEl = el('div', 'result-box__score');
    scoreEl.textContent = score + '%';

    var heardEl = el('div', 'result-box__heard');
    heardEl.textContent = 'You said: ' + heard;

    inner.appendChild(label);
    inner.appendChild(scoreEl);
    inner.appendChild(heardEl);

    if (score < 100) {
      var targetEl = el('div', 'result-box__target');
      targetEl.textContent = 'Target: ' + phrase.zh + ' (' + phrase.pinyin + ')';
      inner.appendChild(targetEl);
    }

    if (audioBlob) appendReplay(resultBox, audioBlob);
  }

  function renderError(resultBox, type) {
    showResultBox(resultBox, 'warn');
    var inner = resultBox.querySelector('.result-box__inner');
    inner.replaceChildren();

    var label = el('div', 'result-box__label');
    label.textContent = '⚠️ ' + describeError(type);
    inner.appendChild(label);
  }

  function renderNoSpeech(resultBox) {
    showResultBox(resultBox, 'warn');
    var inner = resultBox.querySelector('.result-box__inner');
    inner.replaceChildren();

    var label = el('div', 'result-box__label');
    label.textContent = '🎤 Nothing detected — tap 🔊 Speak first, then try again.';
    inner.appendChild(label);
  }

  /* ----------------------------- practise flow ----------------------------- */

  function resetBtn(practiceBtn) {
    practiceBtn.disabled = false;
    setListening(practiceBtn, false);
  }

  function startPractice(phrase, practiceBtn, resultBox) {
    // Reset any other listening button immediately. (Their aborted onend also
    // fires, but this keeps the UI responsive.)
    resetOtherPracticeButtons(practiceBtn);
    practiceBtn.disabled = false;
    setListening(practiceBtn, true);
    clearResult(resultBox);

    if (state.offline || !practice.supported()) {
      startOffline(phrase, practiceBtn, resultBox);
    } else {
      startOnline(phrase, practiceBtn, resultBox);
    }
  }

  function startOnline(phrase, practiceBtn, resultBox) {
    var settled = false;
    var failedOver = false;
    var audioBlob = null;

    var handle = practice.start({
      onStart: function () { /* button already in listening state */ },
      onResult: function (heard, alternatives) {
        if (settled) return;
        settled = true;
        renderResult(resultBox, phrase, heard, practice.score(phrase.zh, heard), audioBlob);
        resetBtn(practiceBtn);
      },
      onAudio: function (blob) {
        audioBlob = blob;
        // Online: the recording finalises just after the result, so append now.
        if (settled && !failedOver && resultBox.classList.contains('is-visible')) {
          appendReplay(resultBox, blob);
        }
      },
      onError: function (err) {
        if (settled) return;
        var t = err && err.type;
        if (t === 'aborted') return; // handled by onEnd
        // Fall back to the local Whisper model for ANY online failure except
        // mic-permission, no-mic, and no-speech (where offline won't help).
        if (t !== 'not-allowed' && t !== 'audio-capture' && t !== 'no-speech') {
          settled = true;
          failedOver = true;
          setOfflinePreference(true);
          startOffline(phrase, practiceBtn, resultBox);
          return;
        }
        settled = true;
        renderError(resultBox, t);
        resetBtn(practiceBtn);
      },
      onEnd: function (info) {
        if (settled) return;
        settled = true;
        resetBtn(practiceBtn);
        if (!info.aborted && !info.hadResult) renderNoSpeech(resultBox);
        if (state.activePractice === handle) state.activePractice = null;
      }
    });

    state.activePractice = handle;
  }

  function startOffline(phrase, practiceBtn, resultBox) {
    var settled = false;
    var audioBlob = null;

    var handle = offline.start({
      onStart: function () { /* button already in listening state */ },
      onAudio: function (blob) {
        audioBlob = blob;
      },
      onTranscribing: function () {
        if (settled) return;
        setProcessing(practiceBtn, true);
        showResultBox(resultBox, 'warn');
        var inner = resultBox.querySelector('.result-box__inner');
        inner.replaceChildren();
        var label = el('div', 'result-box__label');
        label.textContent = '🎧 Transcribing locally… (first time downloads ~40 MB)';
        inner.appendChild(label);
      },
      onProgress: function (fraction) {
        if (settled) return;
        if (typeof fraction === 'number') {
          showResultBox(resultBox, 'warn');
          var inner = resultBox.querySelector('.result-box__inner');
          inner.replaceChildren();
          var label = el('div', 'result-box__label');
          label.textContent = '📥 Downloading speech model… ' + Math.round(fraction * 100) + '%';
          inner.appendChild(label);
        }
      },
      onResult: function (heard) {
        if (settled) return;
        settled = true;
        renderResult(resultBox, phrase, heard, practice.score(phrase.zh, heard), audioBlob);
        resetBtn(practiceBtn);
      },
      onError: function (err) {
        if (settled) return;
        settled = true;
        renderError(resultBox, err && err.type);
        resetBtn(practiceBtn);
      },
      onEnd: function (info) {
        if (settled) return;
        settled = true;
        resetBtn(practiceBtn);
        if (!info.aborted && !info.hadResult) renderNoSpeech(resultBox);
        if (state.activePractice === handle) state.activePractice = null;
      }
    });

    state.activePractice = handle;
  }

  function setOfflinePreference(value) {
    state.offline = value;
    writeOfflinePref(value);
    var cb = document.getElementById('offline-toggle');
    if (cb) cb.checked = value;
  }

  /* ----------------------------- card rendering ----------------------------- */

  function createPhraseCard(phrase) {
    var card = el('article', 'phrase-card');

    var row = el('div', 'phrase-card__row');
    var text = el('div', 'phrase-card__text');

    var zh = el('div', 'phrase-card__zh');
    zh.textContent = phrase.zh;
    zh.setAttribute('lang', 'zh-CN');

    var pinyin = el('div', 'phrase-card__pinyin');
    pinyin.textContent = phrase.pinyin;

    var en = el('div', 'phrase-card__en');
    en.textContent = phrase.en;

    text.appendChild(zh);
    text.appendChild(pinyin);

    if (phrase.phonetic) {
      var phonetic = el('div', 'phrase-card__phonetic');
      phonetic.textContent = phrase.phonetic;
      text.appendChild(phonetic);
    }

    text.appendChild(en);

    if (phrase.note) {
      var note = el('div', 'phrase-card__note');
      note.textContent = phrase.note;
      text.appendChild(note);
    }

    var actions = el('div', 'phrase-card__actions');

    var speakBtn = el('button', 'btn btn--speak');
    speakBtn.type = 'button';
    speakBtn.textContent = '🔊 Speak';
    speakBtn.setAttribute('aria-label', 'Speak the phrase: ' + phrase.zh + ' (' + phrase.en + ')');
    speakBtn.disabled = !speech.supported();
    if (!speech.supported()) speakBtn.title = 'Text-to-speech is not supported in this browser';

    var practiceBtn = el('button', 'btn btn--practice');
    practiceBtn.type = 'button';
    practiceBtn.textContent = '🎤 Practise';
    practiceBtn.setAttribute('aria-label', 'Practise saying: ' + phrase.zh + ' (' + phrase.en + ')');
    practiceBtn.setAttribute('aria-pressed', 'false');
    practiceBtn.disabled = !practice.supported() && !offline.supported();
    if (practiceBtn.disabled) practiceBtn.title = 'Speech recognition is not supported in this browser';

    actions.appendChild(speakBtn);
    actions.appendChild(practiceBtn);
    row.appendChild(text);
    row.appendChild(actions);

    var resultBox = el('div', 'result-box');
    resultBox.setAttribute('role', 'status');
    resultBox.setAttribute('aria-live', 'polite');
    var resultInner = el('div', 'result-box__inner');
    resultBox.appendChild(resultInner);

    card.appendChild(row);
    card.appendChild(resultBox);

    // Speak: cancel any in-flight utterance, then speak this phrase.
    speakBtn.addEventListener('click', function () {
      speech.speak(phrase.zh, {
        rate: state.speed,
        onStart: function () { setSpeaking(speakBtn, true); },
        onEnd: function () { setSpeaking(speakBtn, false); },
        onError: function () { setSpeaking(speakBtn, false); }
      });
    });

    // Practise: first click starts, second click stops.
    practiceBtn.addEventListener('click', function () {
      if (practiceBtn.getAttribute('aria-pressed') === 'true') {
        if (state.activePractice) state.activePractice.stop();
        return;
      }
      startPractice(phrase, practiceBtn, resultBox);
    });

    return {
      element: card,
      practiceBtn: practiceBtn,
      haystack: (phrase.zh + ' ' + phrase.pinyin + ' ' + (phrase.phonetic || '') + ' ' + phrase.en + ' ' + (phrase.note || '')).toLowerCase()
    };
  }

  /* ----------------------------- category rendering ----------------------------- */

  function render() {
    var app = document.getElementById('app');
    app.replaceChildren();
    cardRegistry = [];

    for (var c = 0; c < CATEGORIES.length; c++) {
      var category = CATEGORIES[c];
      var section = el('section', 'category');
      section.dataset.category = category.id;

      var heading = el('h2', 'category__title');
      heading.textContent = category.emoji + ' ' + category.title;

      var desc = el('p', 'category__desc');
      desc.textContent = category.description;

      var cards = el('div', 'category__cards');

      var phrases = PHRASES[category.id] || [];
      for (var p = 0; p < phrases.length; p++) {
        var card = createPhraseCard(phrases[p]);
        cards.appendChild(card.element);
        cardRegistry.push(card);
      }

      section.appendChild(heading);
      section.appendChild(desc);
      section.appendChild(cards);
      app.appendChild(section);
    }
  }

  /* ----------------------------- search filtering ----------------------------- */

  function applySearch(query) {
    var q = (query || '').trim().toLowerCase();
    var visibleCount = 0;

    for (var i = 0; i < cardRegistry.length; i++) {
      var entry = cardRegistry[i];
      var match = !q || entry.haystack.indexOf(q) !== -1;
      entry.element.hidden = !match;
      if (match) visibleCount += 1;
    }

    // Hide category headings when every card inside is filtered out.
    var sections = document.querySelectorAll('.category');
    for (var s = 0; s < sections.length; s++) {
      var cards = sections[s].querySelectorAll('.phrase-card');
      var anyVisible = false;
      for (var k = 0; k < cards.length; k++) {
        if (!cards[k].hidden) { anyVisible = true; break; }
      }
      sections[s].hidden = !anyVisible;
    }

    document.getElementById('no-matches').hidden = visibleCount > 0;
  }

  function populateVoicePicker() {
    var select = document.getElementById('voice-picker');
    if (!select) return;

    var voices = speech.getChineseVoices();
    var current = speech.getPreferredVoiceName() || readVoicePref();

    select.replaceChildren();

    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = 'Auto (best)';
    select.appendChild(auto);

    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var opt = document.createElement('option');
      opt.value = v.name;
      var lang = (v.lang || '').toLowerCase().replace('_', '-');
      opt.textContent = v.name + (lang !== 'zh-cn' ? ' (' + v.lang + ')' : '');
      select.appendChild(opt);
    }

    select.value = current || '';
    select.disabled = voices.length === 0;
  }

  function renderVoiceNotice() {
    var el = document.getElementById('voice-notice');
    if (!el) return;
    if (speech.supported() && speech.getChineseVoices().length === 0) {
      el.hidden = false;
      el.textContent = '🔇 No Chinese voice found on this device, so Speak is silent. On iPhone: Settings → Accessibility → Spoken Content → Voices → Chinese → download Ting-Ting (or Meijia), then reload.';
    } else {
      el.hidden = true;
    }
  }

  /* ----------------------------- bootstrap ----------------------------- */

  function init() {
    renderSupportNotices();
    render();
    speech.init();

    var searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function () {
      applySearch(searchInput.value);
    });

    var speedSlider = document.getElementById('speed-slider');
    var speedValue = document.getElementById('speed-value');
    speedSlider.value = String(state.speed);
    speedValue.textContent = state.speed.toFixed(1) + '×';
    speedSlider.addEventListener('input', function () {
      state.speed = clampSpeed(parseFloat(speedSlider.value));
      writeSpeedPref(state.speed);
      speedValue.textContent = state.speed.toFixed(1) + '×';
    });

    var offlineToggle = document.getElementById('offline-toggle');
    offlineToggle.checked = state.offline;
    offlineToggle.addEventListener('change', function () {
      state.offline = offlineToggle.checked;
      writeOfflinePref(state.offline);
    });

    speech.setPreferredVoiceName(readVoicePref());
    populateVoicePicker();
    renderVoiceNotice();
    speech.onVoicesChanged(function () {
      populateVoicePicker();
      renderVoiceNotice();
    });
    // Some iOS versions never fire voiceschanged; re-check shortly after load.
    setTimeout(renderVoiceNotice, 2500);

    var voicePicker = document.getElementById('voice-picker');
    voicePicker.addEventListener('change', function () {
      var name = voicePicker.value || null;
      speech.setPreferredVoiceName(name);
      writeVoicePref(name);
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* ignore */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
