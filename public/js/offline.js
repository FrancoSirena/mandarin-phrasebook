/**
 * Offline (local) speech recognition via Whisper running in the browser.
 *
 * Uses @huggingface/transformers (loaded lazily from jsdelivr) with the small
 * multilingual "onnx-community/whisper-tiny" model. The model is downloaded on
 * first use (~40 MB) and cached by the browser, so recognition works offline
 * after that — no Google, no VPN, no API key.
 *
 * This module is DOM-free: callers pass callbacks in.
 */
(function (global) {
  'use strict';

  var ns = global.Phrasebook = global.Phrasebook || {};

  var TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1';
  var MODEL_ID = 'onnx-community/whisper-tiny';
  var MAX_RECORD_MS = 12000;

  var transformersModule = null;
  var transcriberPromise = null;
  var activeHandle = null;

  function supported() {
    return typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder === 'function';
  }

  // Load the library once. Dynamic import() works from classic scripts and is
  // CORS-safe because jsdelivr serves `Access-Control-Allow-Origin: *`.
  function loadTransformers() {
    if (transformersModule) return Promise.resolve(transformersModule);
    return import(TRANSFORMERS_URL).then(function (m) {
      transformersModule = m;
      return m;
    });
  }

  // transformers.js reports progress as a number (older) or object (v3).
  function normalizeProgress(p) {
    if (typeof p === 'number') return p;
    if (p && typeof p.progress === 'number') return p.progress;
    return null;
  }

  function getTranscriber(onProgress) {
    if (transcriberPromise) return transcriberPromise;
    transcriberPromise = loadTransformers().then(function (m) {
      m.env.useBrowserCache = true;   // cache model files for offline reuse
      m.env.allowLocalModels = false;
      return m.pipeline('automatic-speech-recognition', MODEL_ID, {
        dtype: 'q8',
        device: 'wasm', // works everywhere; WebGPU needs COOP/COEP headers
        progress_callback: function (p) {
          var f = normalizeProgress(p);
          if (f !== null && onProgress) onProgress(f);
        }
      });
    });
    return transcriberPromise;
  }

  function pickMimeType() {
    if (typeof MediaRecorder.isTypeSupported !== 'function') return '';
    var types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mp4;codecs=mp4a.40.2'];
    for (var i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return '';
  }

  /**
   * Record the microphone and transcribe with Whisper.
   *
   * options: {
   *   onStart: fn()                       — mic is live and recording
   *   onTranscribing: fn()                — recording stopped, model running
   *   onAudio: fn(blob)                   — the raw recording, for playback
   *   onProgress: fn(fraction 0..1)       — model download/load progress
   *   onResult: fn(text)                  — transcript
   *   onError: fn({ type })               — error type string
   *   onEnd: fn({ hadResult, aborted })   — always fired, single cleanup hook
   * }
   *
   * Returns { stop, abort } or null when unsupported.
   */
  function start(options) {
    var opts = options || {};
    var session = { aborted: false, done: false, mediaRecorder: null, stream: null, timer: null };
    var chunks = [];

    function cleanup() {
      if (session.timer) { clearTimeout(session.timer); session.timer = null; }
      if (session.stream) {
        session.stream.getTracks().forEach(function (t) { t.stop(); });
        session.stream = null;
      }
    }

    function finish(err, text) {
      if (session.done) return;
      session.done = true;
      cleanup();
      if (activeHandle && activeHandle.session === session) activeHandle = null;
      if (err) { if (opts.onError) opts.onError(err); }
      else if (typeof text === 'string') { if (opts.onResult) opts.onResult(text); }
      if (opts.onEnd) opts.onEnd({ hadResult: typeof text === 'string' && text.length > 0, aborted: session.aborted });
    }

    function stop(abort) {
      if (session.done) return;
      if (abort) session.aborted = true;
      var rec = session.mediaRecorder;
      if (rec && rec.state !== 'inactive') {
        try { rec.stop(); } catch (e) { finish({ type: 'audio-capture' }, undefined); }
        // rec.onstop continues the flow (transcribe)
      } else {
        finish(null, undefined); // stopped before recording started
      }
    }

    if (!supported()) {
      if (opts.onError) opts.onError({ type: 'offline-unsupported' });
      return null;
    }

    // One offline session at a time.
    if (activeHandle) activeHandle.abort();

    var handle = { session: session, stop: function () { stop(false); }, abort: function () { stop(true); } };
    activeHandle = handle;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (session.done) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      session.stream = stream;

      var rec;
      try {
        var mimeType = pickMimeType();
        rec = mimeType ? new MediaRecorder(stream, { mimeType: mimeType }) : new MediaRecorder(stream);
      } catch (e) {
        finish({ type: 'audio-capture' }, undefined);
        return;
      }
      session.mediaRecorder = rec;

      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onerror = function () { finish({ type: 'audio-capture' }, undefined); };
      rec.onstop = function () {
        if (session.done) return;
        var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        if (opts.onTranscribing) opts.onTranscribing();
        if (opts.onAudio) opts.onAudio(blob);

        getTranscriber(opts.onProgress).then(function (transcriber) {
          var url = URL.createObjectURL(blob);
          return transcriber(url, { language: 'zh', task: 'transcribe' })
            .then(function (result) { return result && result.text ? result.text : ''; })
            .finally(function () { URL.revokeObjectURL(url); });
        }).then(function (text) {
          finish(null, text);
        }).catch(function () {
          finish({ type: 'transcribe-failed' }, undefined);
        });
      };

      try { rec.start(250); } catch (e) { finish({ type: 'audio-capture' }, undefined); return; }

      if (opts.onStart) opts.onStart();

      // Safety net: stop automatically after a few seconds.
      session.timer = setTimeout(function () {
        if (rec.state !== 'inactive') { try { rec.stop(); } catch (e) { /* ignore */ } }
      }, MAX_RECORD_MS);
    }).catch(function (err) {
      var type;
      if (err && err.name === 'NotAllowedError') type = 'not-allowed';
      else if (err && err.name === 'SecurityError') type = 'insecure-context';
      else type = 'audio-capture';
      finish({ type: type }, undefined);
    });

    return handle;
  }

  ns.offline = {
    supported: supported,
    start: start,
    stopAll: function () {
      if (activeHandle) { activeHandle.abort(); activeHandle = null; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
