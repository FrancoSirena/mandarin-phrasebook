/**
 * Text-to-speech wrapper around the Web Speech API (window.speechSynthesis).
 *
 * This module is deliberately free of DOM queries — callers pass callbacks in.
 * It owns speech-synthesis state: the best cached voice, an optional
 * user-preferred voice, and change listeners for the async voice list.
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

  /**
   * Initialise the wrapper and keep the cached voice fresh. Chrome loads the
   * voice list asynchronously, so we re-resolve on `voiceschanged`.
   * Returns true when TTS is supported.
   */
  function init() {
    if (initialized || !supported()) return supported();
    initialized = true;
    refreshVoice();

    var synth = window.speechSynthesis;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', notifyVoices);
    } else {
      // Very old WebKit/Blink exposes only the property handler.
      synth.onvoiceschanged = notifyVoices;
    }
    return true;
  }

  function cancel() {
    if (supported()) window.speechSynthesis.cancel();
  }

  function setPreferredVoiceName(name) { preferredVoiceName = name || null; }
  function getPreferredVoiceName() { return preferredVoiceName; }
  function getChineseVoices() { return chineseVoices(); }

  function onVoicesChanged(cb) {
    if (typeof cb === 'function') voiceListeners.push(cb);
  }

  /**
   * Speak `text` in Chinese. Always cancels any in-flight utterance first.
   *
   * options: {
   *   rate: number   (default 0.85; callers pass the user-chosen speed)
   *   onStart: fn()  — fired when the utterance starts
   *   onEnd: fn()    — fired when the utterance finishes
   *   onError: fn(e) — fired on synthesis error
   * }
   */
  function speak(text, options) {
    if (!supported()) {
      if (options && options.onError) options.onError(new Error('TTS not supported'));
      return null;
    }

    var opts = options || {};
    var rate = typeof opts.rate === 'number' ? opts.rate : 0.85;

    cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // User-chosen voice first, then the best-ranked Chinese voice, then the
    // browser default (which still honours lang="zh-CN").
    var voice = findVoiceByName(preferredVoiceName) || cachedVoice || pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = function () { if (opts.onStart) opts.onStart(); };
    utterance.onend = function () { if (opts.onEnd) opts.onEnd(); };
    utterance.onerror = function (event) { if (opts.onError) opts.onError(event); };

    window.speechSynthesis.speak(utterance);
    return utterance;
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
