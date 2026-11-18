/**
 * Mandarin Travel Phrasebook — entry module.
 *
 * Bootstraps the page: renders categories/cards, wires the Speak and Practise
 * buttons, the live search filter, the speed slider, and the support
 * notices. This is the only module that touches the DOM.
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook;
  var CATEGORIES = ns.CATEGORIES;
  var PHRASES = ns.PHRASES;
  var speech = ns.speech;
  var practice = ns.practice;

  var SPEED_KEY = 'mtp.speed';
  var DEFAULT_SPEED = 0.8;
  var MIN_SPEED = 0.5;
  var MAX_SPEED = 1.0;

  var state = {
    speed: readSpeedPref(),
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

  /* ----------------------------- support notices ----------------------------- */

  function renderSupportNotices() {
    var container = document.getElementById('support-notices');
    container.replaceChildren();

    var notices = [];
    if (!speech.supported()) {
      notices.push('🔇 Text-to-speech is not available in this browser, so the Speak buttons are disabled. Try Chrome or Edge.');
    }
    if (!practice.supported()) {
      notices.push('🎤 Speech recognition is not available in this browser, so the Practise buttons are disabled. Use Chrome or Edge on desktop for the best results.');
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
      case 'network':
        return "Speech recognition couldn't reach the browser's speech service. Chrome sends your audio to Google's servers, which are blocked in some regions and on non-https pages. Try Edge or Safari, use a VPN, and serve the page over https://.";
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

  function renderResult(resultBox, phrase, heard, score) {
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

  function startPractice(phrase, practiceBtn, resultBox) {
    // Reset any other listening button immediately. (Their aborted onend also
    // fires, but this keeps the UI responsive.)
    resetOtherPracticeButtons(practiceBtn);
    setListening(practiceBtn, true);
    clearResult(resultBox);

    var feedbackShown = false;

    var handle = practice.start({
      onStart: function () { /* button already in listening state */ },
      onResult: function (heard, alternatives) {
        feedbackShown = true;
        renderResult(resultBox, phrase, heard, practice.score(phrase.zh, heard));
        setListening(practiceBtn, false);
      },
      onError: function (err) {
        feedbackShown = true;
        renderError(resultBox, err && err.type);
        setListening(practiceBtn, false);
      },
      onEnd: function (info) {
        setListening(practiceBtn, false);
        // If recognition ended with no result and no error (e.g. the user
        // tapped stop early), show the no-speech message instead of leaving
        // the box stuck in "Listening…".
        if (!info.aborted && !feedbackShown && !info.hadResult) {
          renderNoSpeech(resultBox);
        }
        if (state.activePractice === handle) state.activePractice = null;
      }
    });

    state.activePractice = handle;
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
    practiceBtn.disabled = !practice.supported();
    if (!practice.supported()) practiceBtn.title = 'Speech recognition is not supported in this browser';

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
