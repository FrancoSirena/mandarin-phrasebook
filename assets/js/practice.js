/**
 * Speech recognition + scoring wrapper around the Web Speech API.
 *
 * This module is deliberately free of DOM queries — callers pass callbacks in.
 * It owns recognition state (the active recognisers map) only.
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook = global.Phrasebook || {};

  // id -> { recognition: SpeechRecognition, aborted: boolean }
  var activeRecognisers = new Map();
  var nextId = 1;

  function supported() {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  function createRecogniser() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    return recognition;
  }

  // Strip whitespace and CJK/ASCII punctuation so we compare character multisets.
  function clean(s) {
    return String(s == null ? '' : s).replace(/[\s，。！？、,.!?]/g, '');
  }

  /**
   * Score how close `heard` is to `targetZh` (0–100).
   *
   * Algorithm (per spec):
   *   - exact raw match → 100
   *   - otherwise count shared characters as a multiset overlap against the
   *     cleaned target and express that overlap as a percentage.
   * Clamped to 0–100; never divides by zero.
   */
  function score(targetZh, heard) {
    var target = clean(targetZh);
    if (!target) return 0;

    if (heard === targetZh) return 100;

    var heardClean = clean(heard);
    var remaining = Array.from(heardClean);
    var matches = 0;

    for (var i = 0; i < target.length; i++) {
      var ch = target.charAt(i);
      var idx = remaining.indexOf(ch);
      if (idx !== -1) {
        matches += 1;
        remaining.splice(idx, 1);
      }
    }

    var raw = Math.round((matches / target.length) * 100);
    return Math.max(0, Math.min(100, raw));
  }

  function abortAll() {
    activeRecognisers.forEach(function (session, id) {
      session.aborted = true;
      try { session.recognition.abort(); } catch (e) { /* already ended */ }
      activeRecognisers.delete(id);
    });
  }

  function stopSession(id, abort) {
    var session = activeRecognisers.get(id);
    if (!session) return;
    if (abort) session.aborted = true;
    try {
      if (abort) session.recognition.abort();
      else session.recognition.stop();
    } catch (e) { /* ignore races with a just-ended session */ }
  }

  /**
   * Start listening for a single utterance. Only one recognition may run at a
   * time — a new call aborts any recognition already running.
   *
   * options: {
   *   onStart: fn()                      — recognition started
   *   onResult: fn(heard, alternatives)  — final transcript + alternates
   *   onAudio: fn(blob)                  — raw recording (when capture succeeds)
   *   onError: fn({ type })              — raw error type string
   *   onEnd: fn({ hadResult, aborted })  — always fired, the single cleanup hook
   * }
   *
   * Returns { stop, abort } or null when unsupported / failed to start.
   */
  function start(options) {
    if (!supported()) {
      if (options && options.onError) options.onError({ type: 'unsupported' });
      return null;
    }

    // One recognition at a time across all cards.
    abortAll();

    var recognition = createRecogniser();
    var id = nextId++;
    var session = { recognition: recognition, aborted: false, finished: false };
    activeRecognisers.set(id, session);

    var gotResult = false;

    // --- optional audio capture, so the user can replay what they said ---
    var micStream = null;
    var recorder = null;
    var audioChunks = [];

    function releaseMic() {
      if (micStream) {
        micStream.getTracks().forEach(function (t) { t.stop(); });
        micStream = null;
      }
    }

    function stopAudioCapture() {
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (e) { releaseMic(); }
      } else {
        releaseMic();
      }
    }

    // Record in parallel with recognition (they share the same mic permission).
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' &&
        typeof window.MediaRecorder === 'function') {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        if (session.finished) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        micStream = stream;
        var rec;
        try {
          rec = new MediaRecorder(stream);
        } catch (e) {
          releaseMic();
          return;
        }
        recorder = rec;
        rec.ondataavailable = function (e) { if (e.data && e.data.size) audioChunks.push(e.data); };
        rec.onstop = function () {
          if (audioChunks.length && options && options.onAudio) {
            options.onAudio(new Blob(audioChunks, { type: rec.mimeType || 'audio/webm' }));
          }
          releaseMic();
        };
        try { rec.start(250); } catch (e) { releaseMic(); }
      }).catch(function () { /* mic capture failed; recognition still proceeds */ });
    }

    recognition.onstart = function () {
      if (options && options.onStart) options.onStart();
    };

    recognition.onresult = function (event) {
      gotResult = true;
      var result = event.results && event.results[0];
      var heard = result && result[0] ? result[0].transcript : '';
      var alternatives = [];
      if (result) {
        for (var i = 1; i < result.length; i++) alternatives.push(result[i].transcript);
      }
      if (options && options.onResult) options.onResult(heard, alternatives);
    };

    recognition.onerror = function (event) {
      var type = event && event.error ? event.error : 'unknown';
      if (options && options.onError) options.onError({ type: type });
    };

    // onend is the single place we tear down state, whether we got a result,
    // an error, an abort, or the user stopped early. Delete from the map here.
    recognition.onend = function () {
      session.finished = true;
      activeRecognisers.delete(id);
      stopAudioCapture();
      if (options && options.onEnd) {
        options.onEnd({ hadResult: gotResult, aborted: session.aborted });
      }
    };

    try {
      recognition.start();
    } catch (e) {
      session.finished = true;
      activeRecognisers.delete(id);
      stopAudioCapture();
      if (options && options.onError) options.onError({ type: 'start-failed' });
      return null;
    }

    return {
      stop: function () { stopSession(id, false); },
      abort: function () { stopSession(id, true); }
    };
  }

  ns.practice = {
    supported: supported,
    score: score,
    start: start,
    abortAll: abortAll
  };
})(typeof window !== 'undefined' ? window : this);
