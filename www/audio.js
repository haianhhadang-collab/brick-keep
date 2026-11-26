// Brick Keep: âm thanh tự tổng hợp (WebAudio), nhạc nền vui nhộn, đọc to từ tiếng Anh.
(function () {
  "use strict";
  var A = { ctx: null, master: null, sfxOn: true, musicOn: true, music: null };
  var C;

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    C = A.ctx = new AC();
    A.master = C.createGain(); A.master.gain.value = 0.8;
    var comp = C.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    A.master.connect(comp); comp.connect(C.destination);
    A.sfxBus = C.createGain(); A.sfxBus.gain.value = 0.9; A.sfxBus.connect(A.master);
    A.musBus = C.createGain(); A.musBus.gain.value = 0.32; A.musBus.connect(A.master);
    var len = C.sampleRate * 1.0, b = C.createBuffer(1, len, C.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noiseBuf = b;
  };

  function env(g, t, a, peak, dec, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end || 0.0001, t + a + dec);
  }
  function tone(type, f0, f1, dur, vol, when, bus) {
    if (!C) return; var t = C.currentTime + (when || 0);
    var o = C.createOscillator(), g = C.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(bus || A.sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, fType, f0, f1, when, q) {
    if (!C) return; var t = C.currentTime + (when || 0);
    var s = C.createBufferSource(); s.buffer = A.noiseBuf;
    var fl = C.createBiquadFilter(); fl.type = fType || "lowpass"; fl.Q.value = q || 1;
    fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = C.createGain(); env(g, t, 0.004, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(A.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  function nf(semi) { return 523.25 * Math.pow(2, semi / 12); }

  var last = {};
  function lim(k, ms) { var n = performance.now(); if (last[k] && n - last[k] < ms) return false; last[k] = n; return true; }

  A.play = function (k, o) {
    if (!C || !A.sfxOn) return; o = o || {};
    switch (k) {
      case "tick": { var s = PENTA[Math.min(PENTA.length - 1, (o.n || 1) - 1)]; tone("triangle", nf(s), nf(s) * 1.01, 0.12, 0.25); tone("sine", nf(s) * 2, null, 0.06, 0.08); break; }
      case "found": [0, 4, 7, 12, 16].forEach(function (s, i) { tone("triangle", nf(s + 7), null, 0.22, 0.22, i * 0.06); tone("sine", nf(s + 19), null, 0.15, 0.06, i * 0.06 + 0.02); }); break;
      case "power": [0, 7, 12, 19, 24, 28, 31].forEach(function (s, i) { tone("sine", nf(s + 5), null, 0.4, 0.18, i * 0.05); }); noise(0.8, 0.12, "highpass", 3000, 9000); break;
      case "wrong": tone("square", 180, 120, 0.18, 0.08); tone("square", 140, 95, 0.2, 0.06, 0.08); break;
      case "gain": if (lim("gain", 60)) [0, 12].forEach(function (s, i) { tone("square", nf(s + 12), null, 0.07, 0.05, i * 0.05); }); break;
      case "place": tone("square", 900, 700, 0.03, 0.12); tone("square", 1200, 900, 0.03, 0.1, 0.05); tone("sine", 160, 80, 0.12, 0.35, 0.02); break;
      case "pick": tone("triangle", 660, 990, 0.08, 0.15); break;
      case "remove": tone("sawtooth", 400, 120, 0.2, 0.08); noise(0.15, 0.15, "bandpass", 1500, 500); break;
      case "deny": tone("sine", 300, 220, 0.15, 0.15); break;
      case "shoot":
        if (!lim("shoot" + o.kind, 70)) break;
        if (o.kind === "arrow") { tone("triangle", 900, 300, 0.09, 0.12); noise(0.06, 0.05, "highpass", 4000); }
        else if (o.kind === "frost") { tone("sine", 1800, 2600, 0.15, 0.08); tone("sine", 2400, 3200, 0.12, 0.05, 0.03); }
        else if (o.kind === "fire") { noise(0.25, 0.18, "bandpass", 600, 2000, 0, 2); tone("sawtooth", 140, 90, 0.2, 0.05); }
        else if (o.kind === "brick") { tone("sine", 120, 60, 0.25, 0.4); noise(0.15, 0.2, "lowpass", 800, 200); }
        break;
      case "hit":
        if (!lim("hit", 45)) break;
        if (o.armor) { tone("square", 1400 + Math.random() * 300, 900, 0.08, 0.06); tone("sine", 2600, 2000, 0.15, 0.05); }
        else if (o.kind === "frost") { tone("sine", 2200, 1200, 0.12, 0.08); noise(0.1, 0.06, "highpass", 5000); }
        else if (o.kind === "fire") noise(0.2, 0.2, "lowpass", 1500, 300);
        else { noise(0.06, 0.18, "bandpass", 900, 400, 0, 2); tone("sine", 220, 120, 0.06, 0.12); }
        break;
      case "thud": tone("sine", 110, 45, 0.3, 0.5); noise(0.25, 0.25, "lowpass", 900, 150); break;
      case "boom": tone("sine", 90, 30, 0.7, 0.7); noise(0.8, 0.45, "lowpass", 2200, 80); break;
      case "die": if (!lim("die", 40)) break; tone("square", 520, 1040, 0.08, 0.07); for (var i = 0; i < 4; i++) tone("square", 1800 + Math.random() * 1500, null, 0.025, 0.04, 0.05 + i * 0.035); break;
      case "armorbreak": tone("square", 700, 300, 0.25, 0.08); tone("sine", 1500, 900, 0.3, 0.08, 0.02); break;
      case "chomp": if (!lim("chomp", 120)) break; noise(0.07, o.big ? 0.3 : 0.16, "bandpass", o.big ? 400 : 1200, null, 0, 3); noise(0.06, 0.12, "bandpass", 900, null, 0.09, 3); break;
      case "herodie": tone("square", 600, 150, 0.3, 0.07); for (var j = 0; j < 6; j++) tone("square", 1500 + Math.random() * 2000, null, 0.02, 0.05, 0.04 * j); break;
      case "spawn": if (!lim("spawn", 900)) break; tone("sawtooth", 95, 70, 0.4, 0.05); noise(0.3, 0.04, "lowpass", 500, 200); break;
      case "jump": tone("triangle", 300, 900, 0.18, 0.1); break;
      case "ward": tone("sawtooth", 200, 800, 0.6, 0.1); noise(0.7, 0.25, "bandpass", 500, 4000, 0, 1.5); [0, 4, 7, 12].forEach(function (s, i) { tone("sine", nf(s - 5), null, 0.4, 0.12, 0.1 + i * 0.07); }); break;
      case "bigwave": [0, 0.35].forEach(function (w) { tone("sawtooth", 196, 196, 0.5, 0.12, w); tone("sawtooth", 294, 294, 0.5, 0.08, w); }); tone("sawtooth", 262, 262, 0.9, 0.12, 0.75); tone("sawtooth", 392, 392, 0.9, 0.08, 0.75); break;
      case "roar": tone("sawtooth", 110, 55, 0.9, 0.2); noise(0.9, 0.2, "lowpass", 700, 150); break;
      case "starfall": for (var k2 = 0; k2 < 10; k2++) tone("sine", nf(PENTA[(k2 * 3) % PENTA.length] + 12), null, 0.3, 0.1, k2 * 0.06); noise(1.2, 0.1, "highpass", 6000, 2000); break;
      case "howl": tone("sawtooth", 220, 440, 0.4, 0.08); tone("sawtooth", 440, 300, 0.7, 0.08, 0.4); break;
      case "hint": tone("sine", nf(19), null, 0.3, 0.12); tone("sine", nf(24), null, 0.4, 0.1, 0.12); break;
      case "drop": tone("triangle", nf(12), nf(19), 0.1, 0.1); break;
      case "click": tone("triangle", 800, 600, 0.05, 0.12); break;
      case "win": [0, 4, 7, 12, 7, 12, 16, 19].forEach(function (s, i) { tone("square", nf(s), null, 0.18, 0.08, i * 0.12); tone("triangle", nf(s - 12), null, 0.2, 0.12, i * 0.12); }); break;
      case "lose": [7, 6, 5, 4].forEach(function (s, i) { tone("sawtooth", nf(s - 12), nf(s - 12.5), 0.4, 0.08, i * 0.35); }); break;
      case "unlock": [0, 4, 7, 11, 12, 16, 19, 24].forEach(function (s, i) { tone("triangle", nf(s), null, 0.25, 0.12, i * 0.07); }); break;
    }
  };

  // ---------- Nhạc nền: tự sinh vòng lặp vui nhộn ----------
  var SONGS = {
    day: { bpm: 118, root: 48, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: [0, 2, 4, 7, 9] },
    night: { bpm: 104, root: 45, prog: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]], scale: [0, 3, 5, 7, 10] },
    menu: { bpm: 96, root: 50, prog: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], scale: [0, 2, 4, 7, 9] }
  };
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function voice(type, f, t, dur, vol, cut) {
    var o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f;
    var out = g;
    if (cut) { var fl = C.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = cut; o.connect(fl); fl.connect(g); } else o.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(A.musBus); o.start(t); o.stop(t + dur + 0.05);
  }
  A.startMusic = function (name) {
    if (!C) return;
    if (A.music && A.music.name === name) return;
    A.stopMusic();
    var S = SONGS[name] || SONGS.day, step = 60 / S.bpm / 2, seed = 7;
    var R = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // giai điệu cố định 2 ô nhịp, lặp lại
    var mel = []; for (var i = 0; i < 32; i++) mel.push(R() < 0.62 ? S.scale[Math.floor(R() * S.scale.length)] + (R() < 0.3 ? 12 : 0) : null);
    var m = { name: name, n: 0, next: C.currentTime + 0.1 };
    m.timer = setInterval(function () {
      if (!A.musicOn) { m.next = C.currentTime + 0.1; return; }
      while (m.next < C.currentTime + 0.25) {
        var t = m.next, n = m.n, bar = Math.floor(n / 8) % 4, ch = S.prog[bar], beat = n % 8;
        if (beat % 2 === 0) voice("triangle", mf(S.root + ch[0] - 12 + (beat === 4 ? 7 : 0)), t, step * 1.8, 0.5, 900);
        if (beat === 2 || beat === 6) ch.forEach(function (c) { voice("square", mf(S.root + 12 + c), t, step * 0.6, 0.05, 2200); });
        var me = mel[n % 32];
        if (me !== null) { voice("sine", mf(S.root + 24 + me + (ch[0] > 6 ? 0 : 0)), t, step * 1.3, 0.22); voice("sine", mf(S.root + 36 + me), t, step * 0.4, 0.04); }
        if (C && A.noiseBuf) { // tiếng lắc
          var s = C.createBufferSource(); s.buffer = A.noiseBuf; var hp = C.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
          var g = C.createGain(); var v = beat % 2 ? 0.05 : 0.09; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
          s.connect(hp); hp.connect(g); g.connect(A.musBus); s.start(t, Math.random() * 0.5); s.stop(t + 0.06);
        }
        if (beat === 0 || beat === 4) { voice("sine", 110, t, 0.12, 0.35); }
        m.n++; m.next += step;
      }
    }, 60);
    A.music = m;
  };
  A.stopMusic = function () { if (A.music) { clearInterval(A.music.timer); A.music = null; } };

  // ---------- Đọc to ----------
  A.say = function (text, lang) {
    try {
      if (window.AndroidTTS && AndroidTTS.speak) { AndroidTTS.speak(text, lang || "en-US", 0.85); return; }
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(text); u.lang = lang || "en-US"; u.rate = 0.9; u.pitch = 1.1;
      var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.indexOf("en") === 0; });
      if (vs.length) u.voice = vs.filter(function (v) { return /female|zira|samantha|google us/i.test(v.name); })[0] || vs[0];
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { }
  };

  window.Sfx = A;
})();
