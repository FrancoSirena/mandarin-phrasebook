/**
 * Text-to-speech wrapper around the Web Speech API (window.speechSynthesis).
 *
 * This module is deliberately free of DOM queries — callers pass callbacks in.
 * It owns only speech synthesis state (the cached best Chinese voice).
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook = global.Phrasebook || {};

  var cachedVoice = null;
  var initialized = false;

  function supported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  function getVoices() {
    if (!supported()) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  // Rank a voice: exact zh-CN wins, then any zh-* variant, then everything else.
  function voiceRank(voice) {
    var lang = (voice.lang || '').toLowerCase().replace('_', '-');
    if (lang === 'zh-cn') return 0;
    if (lang.indexOf('zh') === 0) return 1;
    return 2;
  }

  // Pick the best available Chinese voice, preferring zh-CN over zh-TW / zh-HK.
  function pickVoice() {
    var voices = getVoices();
    if (!voices.length) return null;

    var chinese = [];
    for (var i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || '').toLowerCase().replace('_', '-');
      if (lang.indexOf('zh') === 0) chinese.push(voices[i]);
    }
    if (!chinese.length) return null;

    return chinese.slice().sort(function (a, b) { return voiceRank(a) - voiceRank(b); })[0];
  }

  function refreshVoice() {
    cachedVoice = pickVoice();
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
      synth.addEventListener('voiceschanged', refreshVoice);
    } else {
      // Very old WebKit/Blink exposes only the property handler.
      synth.onvoiceschanged = refreshVoice;
    }
    return true;
  }

  function cancel() {
    if (supported()) window.speechSynthesis.cancel();
  }

  /**
   * Speak `text` in Chinese. Always cancels any in-flight utterance first.
   *
   * options: {
   *   rate: number   (default 0.85; pass 0.6 for the "slow" toggle)
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

    // Prefer the cached best Chinese voice; otherwise fall back to the browser
    // default (which still honours lang="zh-CN").
    var voice = cachedVoice || pickVoice();
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
    cancel: cancel
  };
})(typeof window !== 'undefined' ? window : this);
