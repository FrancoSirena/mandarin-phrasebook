/**
 * Text-to-speech wrapper around the Web Speech API (window.speechSynthesis).
 *
 * This module is deliberately free of DOM queries — callers pass callbacks in.
 * It owns speech-synthesis state: the best cached voice, an optional
 * user-preferred voice, and change listeners for the async voice list.
 *
 * iOS Safari has several speechSynthesis quirks (voices load lazily, the first
 * utterance is sometimes swallowed, and the synth can start "paused"). speak()
 * below works around them: it resumes the synth, retries once if the utterance
 * never starts, and re-resolves the voice on every attempt.
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook = global.Phrasebook || {};

  var cachedVoice = null;
  var preferredVoiceName = null;
  var initialized = false;
  var voiceListeners = [];

  // Voice names/keywords that tend to mark higher-quality (neural/natural)
  // Chinese voices across macOS, Windows, ChromeOS and Android.
  var QUALITY_KEYWORDS = [
    'natural', 'neural', 'enhanced', 'premium', 'online',
    'meijia', 'xiaoxiao', 'yunxi', 'yunyang', 'yunxia', 'xiaoyi',
    'yating', 'huihui', 'yaoyao', 'kangkang', 'xiaoqiu'
  ];

  function supported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  function getVoices() {
    if (!supported()) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  // Lower score = better.
  function voiceRank(voice) {
    var lang = (voice.lang || '').toLowerCase().replace('_', '-');
    var name = (voice.name || '').toLowerCase();

    var score = 0;
    if (lang === 'zh-cn') score += 0;
    else if (lang.indexOf('zh') === 0) score += 100;
    else score += 200;

    var natural = QUALITY_KEYWORDS.some(function (k) { return name.indexOf(k) !== -1; });
    if (!natural) score += 10;

    return score;
  }

  function chineseVoices() {
    var out = [];
    var voices = getVoices();
    for (var i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || '').toLowerCase().replace('_', '-');
      if (lang.indexOf('zh') === 0) out.push(voices[i]);
    }
    return out.slice().sort(function (a, b) { return voiceRank(a) - voiceRank(b); });
  }

  function pickVoice() {
    var voices = chineseVoices();
    return voices.length ? voices[0] : null;
  }

  function findVoiceByName(name) {
    if (!name) return null;
    var voices = getVoices();
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].name === name) return voices[i];
    }
    return null;
  }

  function refreshVoice() {
    cachedVoice = pickVoice();
  }

  function notifyVoices() {
    refreshVoice();
    for (var i = 0; i < voiceListeners.length; i++) {
      try { voiceListeners[i](); } catch (e) { /* listener error is non-fatal */ }
    }
  }

  function init() {
    if (initialized || !supported()) return supported();
    initialized = true;
    refreshVoice();

    var synth = window.speechSynthesis;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', notifyVoices);
    } else {
      synth.onvoiceschanged = notifyVoices;
    }
    return true;
  }

  function cancel() {
    if (supported()) window.speechSynthesis.cancel();
  }

  function resume() {
    if (!supported()) return;
    try { window.speechSynthesis.resume(); } catch (e) { /* ignore */ }
  }

  function setPreferredVoiceName(name) { preferredVoiceName = name || null; }
  function getPreferredVoiceName() { return preferredVoiceName; }
  function getChineseVoices() { return chineseVoices(); }

  function onVoicesChanged(cb) {
    if (typeof cb === 'function') voiceListeners.push(cb);
  }

  function buildUtterance(text, rate) {
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Re-resolve every attempt: on iOS the voice list may only have become
    // available after the first (ignored) utterance.
    var voice = findVoiceByName(preferredVoiceName) || cachedVoice || pickVoice();
    if (voice) utterance.voice = voice;

    return utterance;
  }

  /**
   * Speak `text` in Chinese. Cancels any in-flight utterance first.
   *
   * options: { rate, onStart, onEnd, onError }
   */
  function speak(text, options) {
    if (!supported()) {
      if (options && options.onError) options.onError(new Error('TTS not supported'));
      return null;
    }

    var opts = options || {};
    var rate = typeof opts.rate === 'number' ? opts.rate : 0.85;

    cancel();
    resume();

    var started = false;
    var settled = false;
    var attempts = 0;
    var watchdog = null;

    function clearWatchdog() {
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
    }

    function finish(err) {
      if (settled) return;
      settled = true;
      clearWatchdog();
      if (err) { if (opts.onError) opts.onError(err); }
      else { if (opts.onEnd) opts.onEnd(); }
    }

    function attempt() {
      attempts += 1;
      var utterance = buildUtterance(text, rate);

      utterance.onstart = function () {
        started = true;
        clearWatchdog();
        if (opts.onStart) opts.onStart();
      };
      utterance.onend = function () { finish(null); };
      utterance.onerror = function (event) { finish(event); };

      try {
        window.speechSynthesis.speak(utterance);
        resume(); // iOS sometimes starts in a paused state
      } catch (e) {
        finish(e);
        return;
      }

      clearWatchdog();
      // If the utterance never starts (a known WebKit/iOS quirk), retry once.
      watchdog = setTimeout(function () {
        if (settled || started) return;
        if (attempts < 2) {
          cancel();
          resume();
          attempt();
        } else {
          finish(new Error('TTS did not start'));
        }
      }, 900);
    }

    attempt();
    return null;
  }

  ns.speech = {
    supported: supported,
    init: init,
    speak: speak,
    cancel: cancel,
    getChineseVoices: getChineseVoices,
    setPreferredVoiceName: setPreferredVoiceName,
    getPreferredVoiceName: getPreferredVoiceName,
    onVoicesChanged: onVoicesChanged
  };
})(typeof window !== 'undefined' ? window : this);
