// Brick Keep: màn hình, vòng lặp game, điều khiển, chơi 2 máy (PeerJS/WebRTC).
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  // Chạy trong app robot Mai Ca: báo sự kiện để robot cổ vũ (chạy riêng thì không có window.MaiCa, bỏ qua)
  function maiCa(k, tu) { try { if (window.MaiCa) window.MaiCa.suKien(k, tu || ""); } catch (e) { } }
  var KEY = "brickkeep-v1";
  var DEF = { cleared: 0, topic: "animals", showEn: false, sfx: true, music: true, speak: true, name: "Bé" };
  var store = (function () { var s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { } for (var k in DEF) if (s[k] === undefined) s[k] = DEF[k]; return s; })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } }
  Sfx.sfxOn = store.sfx; Sfx.musicOn = store.music;

  function topicObj() { return window.TOPICS.filter(function (t) { return t.id === store.topic; })[0] || window.TOPICS[0]; }
  function worldOf(level) { return Math.min(D.WORLDS.length - 1, Math.floor((level - 1) / D.LEVELS_PER_WORLD)); }
  function lvlLabel(level) { return (worldOf(level) + 1) + "-" + ((level - 1) % D.LEVELS_PER_WORLD + 1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var portraits = {};
  function portrait(type) { return portraits[type] || (portraits[type] = Art.portrait(type, 96)); }

  // ---------- Màn hình ----------
  var cur = "scr-home";
  function show(id) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.toggle("active", s.id === id); });
    cur = id;
    if (id !== "scr-game") { if (Sfx.ctx) Sfx.startMusic("menu"); menuBg.resize(); }
  }
  function isOn(id) { return cur === id; }
  document.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { click(); show("scr-" + b.getAttribute("data-go")); }; });
  function click() { Sfx.init(); Sfx.play("click"); if (!Sfx.music) Sfx.startMusic(isOn("scr-game") ? "day" : "menu"); }
  document.addEventListener("pointerdown", function once() { Sfx.init(); if (!Sfx.music) Sfx.startMusic(isOn("scr-game") ? (D.WORLDS[G ? G.world : 0].night ? "night" : "day") : "menu"); }, { once: true });

  function refreshHome() {
    var t = topicObj(); $("lbl-topic").textContent = t.vi; $("lbl-topic-ic").textContent = t.icon;
  }

  // ---------- Nền động của menu: một trận giả ----------
  var menuBg = new Renderer($("menu-bg"));
  var demo = null, demoT = 0;
  function newDemo() {
    demo = new Battle({ mode: "pvp", pvpTime: 1e9, players: [{ id: 1, side: "hero" }, { id: 2, side: "shadow" }] });
    demo.players[1].bricks = demo.players[2].bricks = 1e6;
    [["archer", 0, 1], ["sage", 1, 0], ["knight", 1, 4], ["frost", 2, 2], ["archer", 3, 1], ["cannon", 4, 0], ["fire", 3, 3], ["twin", 0, 3]].forEach(function (h) { demo.act(1, { a: "place", hero: h[0], lane: h[1], col: h[2] }); });
    demo.drain();
    menuBg.reset(); menuBg.setWorld(worldOf(Math.min(D.LEVEL_COUNT, store.cleared + 1)));
  }
  newDemo();
  window.addEventListener("resize", function () { menuBg.resize(); if (G) G.r.resize(); });

  // ---------- Chủ đề ----------
  $("btn-topic").onclick = function () {
    click();
    var h = "";
    window.TOPICS.forEach(function (t) { h += '<button class="topic' + (t.id === store.topic ? " on" : "") + '" data-id="' + t.id + '"><span class="e">' + t.icon + "</span><span>" + esc(t.vi) + "<small>" + esc(t.en) + " · " + t.words.length + " từ</small></span></button>"; });
    $("topic-grid").innerHTML = h;
    $("topic-grid").querySelectorAll(".topic").forEach(function (b) { b.onclick = function () { store.topic = b.getAttribute("data-id"); save(); click(); refreshHome(); show("scr-home"); }; });
    show("scr-topic");
  };

  // ---------- Sổ tay ----------
  $("btn-almanac").onclick = function () {
    click();
    var h = "";
    D.HERO_ORDER.forEach(function (k) {
      var H = D.HEROES[k], lock = D.HERO_UNLOCK[k] > store.cleared;
      h += '<div class="alm' + (lock ? " locked" : "") + '"><img alt="" src="' + portrait(k) + '"><div><b>' + H.vi + "</b><i>" + H.name + " · " + H.cost + " gạch</i><p>" + (lock ? "Mở khóa sau màn " + lvlLabel(D.HERO_UNLOCK[k]) : H.desc) + "</p></div></div>";
    });
    $("alm-heroes").innerHTML = h; h = "";
    D.MON_ORDER.forEach(function (k) { var M = D.MONS[k]; h += '<div class="alm"><img alt="" src="' + portrait(k) + '"><div><b>' + M.vi + "</b><i>" + M.name + "</i><p>" + M.desc + "</p></div></div>"; });
    $("alm-mons").innerHTML = h;
    show("scr-almanac");
  };

  // ---------- Cài đặt ----------
  $("btn-settings").onclick = function () {
    click();
    $("set-music").checked = store.music; $("set-sfx").checked = store.sfx; $("set-speak").checked = store.speak; $("set-en").checked = store.showEn; $("set-name").value = store.name;
    show("scr-settings");
  };
  $("set-music").onchange = function () { store.music = Sfx.musicOn = this.checked; save(); };
  $("set-sfx").onchange = function () { store.sfx = Sfx.sfxOn = this.checked; save(); };
  $("set-speak").onchange = function () { store.speak = this.checked; save(); };
  $("set-en").onchange = function () { store.showEn = this.checked; save(); };
  $("set-name").oninput = function () { store.name = this.value.trim().slice(0, 12) || "Bé"; save(); };
  $("btn-reset").onclick = function () { if (confirm("Xóa tiến trình và chơi lại từ màn 1?")) { store.cleared = 0; save(); newDemo(); show("scr-home"); } };

  // ---------- Bản đồ màn ----------
  $("btn-adventure").onclick = function () { click(); openMap(); };
  function openMap() {
    var h = "", next = Math.min(D.LEVEL_COUNT, store.cleared + 1);
    D.WORLDS.forEach(function (W, wi) {
      var first = wi * D.LEVELS_PER_WORLD + 1;
      h += '<div class="world ' + W.id + (first > next ? " locked" : "") + '"><h3>' + W.vi + '</h3><div class="wn">' + W.name + '</div><div class="nodes">';
      for (var i = 0; i < D.LEVELS_PER_WORLD; i++) {
        var lv = first + i, done = lv <= store.cleared, lock = lv > next, boss = lv % D.LEVELS_PER_WORLD === 0;
        var gift = D.HERO_ORDER.filter(function (k) { return D.HERO_UNLOCK[k] === lv; })[0];
        h += '<button class="node' + (done ? " done" : "") + (lock ? " lock" : "") + (lv === next ? " cur" : "") + '" data-lv="' + lv + '"' + (lock ? " disabled" : "") + '><span class="n">' + (lock ? "🔒" : (done ? "✓" : lv)) + "</span><span>Màn " + lvlLabel(lv) + "<small>" + (boss ? "👑 Trùm cuối" : (gift ? "Thưởng: " + D.HEROES[gift].vi : "")) + "</small></span>" + (gift && !lock ? '<img alt="" src="' + portrait(gift) + '">' : "") + "</button>";
      }
      h += "</div></div>";
    });
    $("map-worlds").innerHTML = h;
    $("map-note").textContent = "Đã qua " + store.cleared + " / " + D.LEVEL_COUNT + " màn";
    $("map-worlds").querySelectorAll(".node:not(.lock)").forEach(function (b) { b.onclick = function () { click(); startSolo(+b.getAttribute("data-lv")); }; });
    show("scr-map");
  }

  // ---------- Phiên chơi ----------
  var G = null;
  var field = $("field");
  var board = new WordBoard({
    gridEl: $("board"), cluesEl: $("clues"),
    topic: topicObj,
    level: function () { return G ? (G.mode === "pvp" ? 6 : G.level) : 1; },
    showEnglish: function () { return store.showEn; },
    locked: function () { return !G || G.over || G.paused; },
    onStep: function (n) { Sfx.play("tick", { n: n }); },
    onPreview: function (s) { var p = $("preview"); p.classList.remove("ok", "bad", "msg"); p.textContent = s ? s.toUpperCase() : " "; },
    onFound: function (w, rects) {
      Sfx.play(w.power ? "power" : "found");
      maiCa("dung", w.en);
      if (store.speak) setTimeout(function () { Sfx.say(w.en); }, 150);
      var gain = D.wordGain(w.en);
      act({ a: "word", w: w.en, power: !!w.power });
      G.words.push(w);
      var p = $("preview"); p.classList.remove("msg", "bad"); p.classList.add("ok"); p.textContent = w.en.toUpperCase() + " +" + gain;
      flyBricks(rects, gain);
      if (w.power) banner(G.side === "shadow" ? "Tiếng hú bóng đêm!" : "Mưa sao băng!", G.side === "shadow" ? "Gọi thêm 3 quỷ con" : "Mọi quái đều trúng sao");
      coachDone(0);
    },
    onWrong: function () { Sfx.play("wrong"); maiCa("sai"); var p = $("preview"); p.classList.add("bad"); setTimeout(function () { p.classList.remove("bad"); }, 400); },
    onNewBoard: function () { Sfx.play("unlock"); }
  });

  function startSolo(level) {
    var cfg = { mode: "solo", level: level, world: worldOf(level), players: [{ id: 1, name: store.name, side: "hero", slot: 0 }], heroes: D.heroesFor(store.cleared) };
    startGame(cfg, "local", 1);
  }

  function startGame(cfg, net, myId) {
    var me = cfg.players.filter(function (p) { return p.id === myId; })[0];
    G = { cfg: cfg, net: net, mode: cfg.mode, level: cfg.level || 6, world: cfg.world || 0, myId: myId, side: me.side, slot: me.slot,
      battle: net === "client" ? null : new Battle(cfg), sel: null, tool: null, hover: null, view: null,
      over: false, paused: false, words: [], outEv: [], snapT: 0, coach: -1, hintCd: 0, shufCd: 0, t: 0 };
    show("scr-game");
    $("pause").classList.add("hidden"); $("result").classList.add("hidden");
    if (!G.r) G.r = new Renderer(field);
    G.r.resize(); G.r.setWorld(G.world); G.r.reset();
    board.generate();
    $("preview").textContent = " ";
    buildCards();
    buildFlags();
    var W = D.WORLDS[G.world];
    $("lvl-name").textContent = cfg.mode === "pvp" ? "Đối kháng · " + W.vi : "Màn " + lvlLabel(cfg.level) + " · " + W.vi;
    $("btn-pause").textContent = "❚❚";
    $("partner").classList.toggle("hidden", cfg.mode === "solo");
    Sfx.init(); Sfx.startMusic(W.night ? "night" : "day");
    var sub = cfg.mode === "pvp" ? (G.side === "hero" ? "Bạn là Hiệp sĩ: giữ thành 3 phút!" : "Bạn là Bóng đêm: phá thành trong 3 phút!") : (cfg.mode === "coop" ? "Hai bạn cùng giữ lâu đài" : "Tìm từ, xây quân, giữ lâu đài!");
    banner(cfg.mode === "pvp" ? "Đối kháng!" : "Màn " + lvlLabel(cfg.level), sub);
    maiCa("bat_dau", store.topic);
    // hướng dẫn
    $("coach").classList.add("hidden");
    if (cfg.mode === "solo" && cfg.level === 1) setTimeout(function () { coach(0, "Kéo ngón tay qua các chữ cái bên phải để tìm từ tiếng Anh. Mỗi từ cho thêm gạch!"); }, 2300);
    else {
      var fresh = D.HERO_ORDER.filter(function (k) { return D.HERO_UNLOCK[k] === cfg.level - 1 && cfg.mode === "solo"; })[0];
      if (fresh) setTimeout(function () { coach(5, "Quân mới: " + D.HEROES[fresh].vi + " – " + D.HEROES[fresh].desc); setTimeout(function () { coachDone(5); }, 6000); }, 2400);
      else if (cfg.mode === "pvp" && G.side === "shadow") setTimeout(function () { coach(6, "Tìm từ để có gạch, chọn thẻ quái rồi chạm vào một làn để thả quái."); setTimeout(function () { coachDone(6); }, 7000); }, 2400);
    }
  }

  function coach(step, text) { if (!G) return; G.coach = step; var c = $("coach"); c.textContent = text; c.classList.remove("hidden"); }
  function coachDone(step) {
    if (!G || G.coach !== step) return;
    $("coach").classList.add("hidden"); G.coach = -1;
    if (step === 0 && G.mode === "solo" && G.level === 1) setTimeout(function () { if (G && !G.over && G.coach < 0) coach(1, "Giờ chọn thẻ Cung thủ ở góc trên, rồi chạm vào một ô cỏ để đặt quân."); }, 600);
    if (step === 1) setTimeout(function () { if (G && !G.over && G.coach < 0) { coach(2, "Tuyệt! Quái đi từ bên phải. Tìm thêm từ để có gạch và đặt thêm cung thủ ở các làn khác."); setTimeout(function () { coachDone(2); }, 7000); } }, 500);
  }

  function myCards() { return G.side === "shadow" ? D.SHADOW_CARDS : G.cfg.heroes; }
  function cardInfo(k) { return G.side === "shadow" ? D.MONS[k] : D.HEROES[k]; }
  function buildCards() {
    var h = "";
    myCards().forEach(function (k, i) {
      var I = cardInfo(k);
      h += '<button class="card' + (G.side === "shadow" ? " shadow" : "") + '" data-k="' + k + '" title="' + esc(I.vi) + '"><span class="key">' + (i + 1) + '</span><img alt="" src="' + portrait(k) + '"><span class="cost"><i></i>' + I.cost + '</span><span class="cdv"></span></button>';
    });
    $("cards").innerHTML = h;
    $("cards").querySelectorAll(".card").forEach(function (b) { b.onclick = function () { pickCard(b.getAttribute("data-k")); }; });
    $("tool-hammer").classList.toggle("hidden", G.side === "shadow");
    G.cardEls = {}; $("cards").querySelectorAll(".card").forEach(function (b) { G.cardEls[b.getAttribute("data-k")] = b; });
  }
  function pickCard(k) {
    if (!G || G.over) return;
    Sfx.init();
    var me = G.view && G.view.pl[G.myId];
    if (G.sel === k) { G.sel = null; }
    else {
      if (me && me.b < cardInfo(k).cost) { Sfx.play("deny"); toastPoor(); return; }
      if (me && me.cd[k]) { Sfx.play("deny"); return; }
      G.sel = k; G.tool = null; Sfx.play("pick");
    }
    syncSel();
  }
  function syncSel() {
    for (var k in G.cardEls) G.cardEls[k].classList.toggle("sel", G.sel === k);
    $("tool-hammer").classList.toggle("sel", G.tool === "hammer");
  }
  $("tool-hammer").onclick = function () { if (!G) return; G.tool = G.tool === "hammer" ? null : "hammer"; G.sel = null; Sfx.play("pick"); syncSel(); };
  function toastPoor() { var b = $("bank"); b.classList.remove("poor"); void b.offsetWidth; b.classList.add("poor"); previewMsg("Cần thêm gạch! Tìm thêm từ nhé", true); }
  function previewMsg(text, bad) { var p = $("preview"); p.classList.remove("ok", "bad"); p.classList.add("msg"); if (bad) p.classList.add("bad"); p.textContent = text; clearTimeout(previewMsg.t); previewMsg.t = setTimeout(function () { p.classList.remove("bad", "msg"); p.textContent = " "; }, 1600); }

  function buildFlags() {
    var h = "";
    var fl = G.battle ? G.battle.flags : (G.mode === "pvp" ? [0.5, 1] : []);
    fl.forEach(function (f) { h += '<span class="prog-flag" style="right:' + (f * 100).toFixed(1) + '%"></span>'; });
    $("prog-flags").innerHTML = h;
    G.flagsBuilt = fl.length > 0;
  }

  // ---------- Điều khiển trên sân ----------
  function fieldPos(e) { var r = field.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function hoverAt(e) {
    if (!G || !G.r.g) return null;
    var p = fieldPos(e), h = G.r.g.pick(p[0], p[1]);
    if (!h) return null;
    if (G.side === "shadow") return h.gx > 3 ? { lane: h.lane, col: 8 } : null;
    if (h.col < 0 || h.col >= D.COLS) return null;
    return h;
  }
  field.addEventListener("pointermove", function (e) { if (G) G.hover = hoverAt(e); });
  field.addEventListener("pointerleave", function () { if (G && e_isMouse) G.hover = null; });
  var e_isMouse = true;
  field.addEventListener("pointerdown", function (e) { e_isMouse = e.pointerType === "mouse"; if (G) G.hover = hoverAt(e); });
  field.addEventListener("pointerup", function (e) {
    if (!G || G.over) return;
    var h = hoverAt(e); if (!h) return;
    if (G.side === "shadow") {
      if (G.sel) { act({ a: "summon", mon: G.sel, lane: h.lane }); G.sel = null; syncSel(); }
      return;
    }
    if (G.tool === "hammer") { act({ a: "remove", lane: h.lane, col: h.col }); G.tool = null; syncSel(); Sfx.play("remove"); return; }
    if (G.sel) {
      var me = G.view && G.view.pl[G.myId];
      if (me && me.b < D.HEROES[G.sel].cost) { Sfx.play("deny"); toastPoor(); return; }
      act({ a: "place", hero: G.sel, lane: h.lane, col: h.col });
      G.sel = null; syncSel();
      if (!e_isMouse) G.hover = null;
      coachDone(1);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (!G || !isOn("scr-game")) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { var k = myCards()[n - 1]; if (k) pickCard(k); }
    else if (e.key === "Escape") { G.sel = null; G.tool = null; syncSel(); }
    else if (e.key === "h" || e.key === "H") $("tool-hammer").click();
  });

  function uiState() {
    if (!G || !G.hover) return null;
    if (G.side === "shadow") return G.sel ? { hover: G.hover, mode: "summon" } : null;
    if (G.tool === "hammer") return { hover: G.hover, mode: "remove" };
    if (!G.sel) return null;
    var busy = G.r.heroes && Object.keys(G.r.heroes).some(function (id) { var o = G.r.heroes[id]; return o.lane === G.hover.lane && o.col === G.hover.col; });
    return { hover: G.hover, mode: "place", ghost: busy ? null : G.sel, ok: !busy };
  }

  // Gửi thao tác: máy mình chạy trận thì làm luôn, máy khách thì gửi cho chủ phòng
  function act(a) {
    if (!G) return;
    if (G.battle) G.battle.act(G.myId, a);
    else if (Net.conn && Net.conn.open) try { Net.conn.send({ t: "act", a: a }); } catch (e) { }
  }

  // ---------- Nút bảng chữ ----------
  $("btn-hint").onclick = function () { if (!G || G.over || G.hintCd > 0) return; if (board.hint()) { Sfx.play("hint"); G.hintCd = 12; } };
  $("btn-shuffle").onclick = function () { if (!G || G.over || G.shufCd > 0) return; board.reshuffle(); Sfx.play("unlock"); G.shufCd = 20; };

  // ---------- Bay gạch từ bảng chữ lên túi gạch ----------
  function flyBricks(rects, gain) {
    var bank = $("bank").getBoundingClientRect(), tx = bank.left + bank.width / 2, ty = bank.top + bank.height / 2, layer = $("fly");
    rects.forEach(function (r, i) {
      var d = document.createElement("div"); d.className = "fly";
      var x = r.left + r.width / 2 - 11, y = r.top + r.height / 2 - 6;
      d.style.left = x + "px"; d.style.top = y + "px"; layer.appendChild(d);
      setTimeout(function () { d.style.transform = "translate(" + (tx - x - 11) + "px," + (ty - y - 6) + "px) rotate(" + (200 + i * 40) + "deg) scale(.7)"; }, 30 + i * 60);
      setTimeout(function () { d.remove(); if (i === rects.length - 1) { var b = $("bank"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); Sfx.play("gain"); } }, 720 + i * 60);
    });
    var r0 = rects[Math.floor(rects.length / 2)];
    if (r0) { var t = document.createElement("div"); t.className = "fly-txt"; t.textContent = "+" + gain; t.style.left = (r0.left) + "px"; t.style.top = (r0.top - 30) + "px"; layer.appendChild(t); setTimeout(function () { t.remove(); }, 1000); }
  }

  var bannerTimer = 0;
  function banner(title, sub) {
    var b = $("banner"); b.innerHTML = esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "");
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  }

  // ---------- Sự kiện trận ----------
  var DENY = { bricks: "Cần thêm gạch!", cd: "Thẻ đang hồi…", busy: "Ô này có quân rồi" };
  function handleEvent(e) {
    if (!G) return;
    G.r.event(e);
    var mine = e.pid === G.myId;
    switch (e.k) {
      case "gain": break;
      case "deny": if (mine) { Sfx.play("deny"); if (e.why === "bricks") toastPoor(); else previewMsg(DENY[e.why] || "", true); } break;
      case "hint": if (mine) { if (board.hint()) Sfx.play("hint"); } break;
      case "place": Sfx.play("place"); break;
      case "bigwave": Sfx.play("bigwave"); maiCa("canh_bao"); if (G.mode === "pvp") banner("Nửa trận rồi!", "Cố lên!"); else banner(e.last ? "Đợt cuối cùng!" : "Đợt quái lớn đang tới!", e.last ? "Giữ vững nào!" : ""); break;
      case "boss": Sfx.play("roar"); maiCa("canh_bao"); banner("Vua Bóng Đêm xuất hiện!", "Dồn hết sức vào làn giữa"); break;
      case "end": break;
      default: Sfx.play(e.k, e);
    }
  }

  function applyView(v) {
    G.view = v;
    G.r.feed(v);
    var me = v.pl[G.myId];
    if (me) {
      $("bricks").textContent = me.b;
      for (var k in G.cardEls) {
        var el = G.cardEls[k], I = cardInfo(k);
        el.classList.toggle("poor", me.b < I.cost);
        el.style.setProperty("--cd", me.cd[k] || 0);
      }
    }
    $("prog-fill").style.width = (v.pr * 100) + "%";
    $("prog-head").style.right = (v.pr * 100) + "%";
    if (!G.flagsBuilt && v.fl && v.fl.length) { var h = ""; v.fl.forEach(function (f) { h += '<span class="prog-flag" style="right:' + (f * 100).toFixed(1) + '%"></span>'; }); $("prog-flags").innerHTML = h; G.flagsBuilt = true; }
    if (v.mode === "pvp") { var left = Math.max(0, Math.ceil(v.dur - v.t)); $("lvl-name").textContent = "Đối kháng · còn " + Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2); }
    if (G.mode !== "solo") {
      var o = null; for (var id in v.pl) if (+id !== G.myId) o = v.pl[id];
      if (o) $("partner").innerHTML = '<i style="background:' + Art.OWNER[o.slot || 0] + '"></i>' + esc(o.name || "Bạn") + " · " + (o.side === "shadow" ? "Bóng đêm" : "Hiệp sĩ") + " · " + o.b + " gạch · " + o.w + " từ";
    }
    if (v.r && !G.over) endGame(v.r);
  }

  // ---------- Vòng lặp ----------
  function tickBattle(dt) {
    if (!G || !G.battle || G.paused || G.over) return;
    var steps = Math.max(1, Math.ceil(dt / 0.025));
    for (var s = 0; s < steps; s++) G.battle.update(dt / steps);
    var evs = G.battle.drain();
    evs.forEach(handleEvent);
    if (G.net === "host") { G.outEv = G.outEv.concat(evs); }
    var v = G.battle.view();
    applyView(v);
    if (G.net === "host") {
      G.snapT += dt;
      if (G.snapT >= 0.08 || v.r) { G.snapT = 0; Net.send({ t: "snap", v: v, e: G.outEv }); G.outEv = []; }
    }
  }
  // Máy chủ trận bị ẩn (chuyển ứng dụng, tab nền): trình duyệt dừng khung hình, nên chạy tiếp bằng bộ đếm
  var hiddenLast = 0, lastFrameAt = 0;
  setInterval(function () {
    var now = performance.now();
    if ((document.hidden || now - lastFrameAt > 250) && G && G.net === "host" && isOn("scr-game")) {
      var dt = hiddenLast ? Math.min(0.5, (now - hiddenLast) / 1000) : 0.1;
      tickBattle(dt);
      hiddenLast = now; last = now;
    } else hiddenLast = 0;
  }, 100);
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; lastFrameAt = performance.now();
    var t = now / 1000;
    if (G && isOn("scr-game")) {
      G.hintCd = Math.max(0, G.hintCd - dt); G.shufCd = Math.max(0, G.shufCd - dt);
      $("btn-hint").disabled = G.hintCd > 0; $("btn-shuffle").disabled = G.shufCd > 0;
      tickBattle(dt);
      G.r.draw(t, G.paused ? 0 : dt, uiState());
    } else {
      demoT += dt;
      demo.update(dt);
      if (demoT > 2.6) { demoT = 0; demo.act(2, { a: "summon", mon: D.SHADOW_CARDS[Math.floor(Math.random() * 5)], lane: Math.floor(Math.random() * 5) }); demo.players[2].cds = {}; }
      demo.drain().forEach(function (e) { menuBg.event(e); });
      if (demo.result || demo.heroes.length < 4) newDemo();
      menuBg.feed(demo.view());
      menuBg.draw(t, dt, null);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Tạm dừng, kết thúc ----------
  $("btn-pause").onclick = function () {
    if (!G || G.over) return; click();
    if (G.net === "local") G.paused = true;
    $("btn-restart").classList.toggle("hidden", G.net !== "local");
    $("btn-resume").querySelector("b").textContent = G.net === "local" ? "Chơi tiếp" : "Quay lại trận";
    $("pause").classList.remove("hidden");
  };
  $("btn-resume").onclick = function () { click(); G.paused = false; $("pause").classList.add("hidden"); };
  $("btn-restart").onclick = function () { click(); var c = G.cfg; startGame(c, "local", 1); };
  $("btn-quit").onclick = function () { click(); quitGame(); };
  $("btn-home2").onclick = function () { click(); quitGame(); };
  function quitGame() { if (G && G.net !== "local") leaveNet(); G = null; Sfx.stopMusic(); newDemo(); refreshHome(); show("scr-home"); }

  function endGame(r) {
    G.over = true; G.sel = null; G.tool = null; syncSel(); $("coach").classList.add("hidden");
    var win = r === "win" || (r === "hero" && G.side === "hero") || (r === "shadow" && G.side === "shadow");
    Sfx.stopMusic(); Sfx.play(win ? "win" : "lose");
    maiCa(win ? "thang" : "thua");
    var title, sub;
    if (G.mode === "pvp") { title = win ? "Bạn thắng!" : "Bạn thua rồi!"; sub = r === "hero" ? "Hiệp sĩ đã giữ được lâu đài." : "Bóng đêm đã phá được lâu đài."; }
    else { title = win ? "Lâu đài an toàn!" : "Quái vào lâu đài mất rồi!"; sub = win ? "Màn " + lvlLabel(G.level) + " hoàn thành." : "Thử lại nhé: tìm từ nhanh hơn để có nhiều gạch."; }
    $("res-title").textContent = title; $("res-sub").textContent = sub;
    var un = $("res-unlock"); un.classList.add("hidden");
    if (win && G.mode !== "pvp" && G.level > store.cleared) {
      store.cleared = G.level; save();
      var gift = D.HERO_ORDER.filter(function (k) { return D.HERO_UNLOCK[k] === G.level; })[0];
      if (gift) { un.innerHTML = '<img alt="" src="' + portrait(gift) + '"><div><small>Quân mới!</small><b>' + D.HEROES[gift].vi + "</b><small>" + D.HEROES[gift].desc + "</small></div>"; un.classList.remove("hidden"); setTimeout(function () { Sfx.play("unlock"); }, 900); }
    }
    var seen = {}, wh = "";
    G.words.forEach(function (w) { if (!seen[w.en]) { seen[w.en] = 1; wh += "<span>" + w.icon + " " + w.en + "</span>"; } });
    $("res-words").innerHTML = wh ? wh : "";
    var canDrive = G.net !== "client";
    $("btn-next").classList.toggle("hidden", !(canDrive && win && G.mode !== "pvp" && G.level < D.LEVEL_COUNT));
    $("btn-again").classList.toggle("hidden", !canDrive);
    setTimeout(function () { if (G && G.over) $("result").classList.remove("hidden"); }, 1300);
  }
  $("btn-next").onclick = function () { click(); var c = G.cfg; if (G.net === "local") startSolo(c.level + 1); else hostStart(c.level + 1); };
  $("btn-again").onclick = function () { click(); var c = G.cfg; if (G.net === "local") startSolo(c.level); else hostStart(c.mode === "pvp" ? L.world : c.level); };

  // ---------- Chơi 2 máy (PeerJS) ----------
  var Net = { peer: null, conn: null, code: "", role: null, lobby: [] };
  var L = { mode: "coop", level: 1, world: 0, role: "hero" };
  var CODE_CH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function makeCode() { var s = ""; for (var i = 0; i < 4; i++) s += CODE_CH.charAt(Math.floor(Math.random() * CODE_CH.length)); return s; }
  function peerId(code) { return "brickkeep-v1-" + code.toLowerCase(); }
  function status(text, err) { var s = $("lobby-status"); s.textContent = text || ""; s.classList.toggle("err", !!err); }
  Net.send = function (m) { if (Net.conn && Net.conn.open) try { Net.conn.send(m); } catch (e) { } };
  function leaveNet() { try { if (Net.conn) Net.conn.close(); if (Net.peer) Net.peer.destroy(); } catch (e) { } Net.peer = null; Net.conn = null; Net.role = null; Net.lobby = []; }

  $("btn-coop").onclick = function () { click(); openLobby("coop"); };
  $("btn-versus").onclick = function () { click(); openLobby("pvp"); };
  $("btn-lobby-back").onclick = function () { click(); leaveNet(); show("scr-home"); };
  function openLobby(mode) {
    leaveNet(); L.mode = mode; L.level = Math.min(D.LEVEL_COUNT, store.cleared + 1); L.world = worldOf(L.level);
    $("lobby-title").textContent = mode === "coop" ? "Cùng phe (2 máy)" : "Đối kháng (2 máy)";
    $("lobby-desc").textContent = mode === "coop"
      ? "Hai bạn, mỗi người một máy, cùng giữ một lâu đài trước các đợt quái của máy. Mỗi người có bảng chữ và túi gạch riêng."
      : "Một bạn làm Hiệp sĩ đặt quân giữ thành, một bạn làm Bóng đêm thả quái phá thành. Cả hai đều phải tìm từ để có gạch. Hiệp sĩ giữ được 3 phút là thắng.";
    $("lobby-choose").classList.remove("hidden"); $("lobby-room").classList.add("hidden");
    $("lobby-host-opts").classList.add("hidden"); $("lobby-wait").classList.add("hidden");
    $("row-role").classList.toggle("hidden", mode !== "pvp");
    $("lbl-optname").textContent = mode === "pvp" ? "Bản đồ" : "Màn";
    status(typeof Peer === "undefined" ? "Thiếu thư viện chơi mạng." : "Cần có mạng Internet trên cả hai máy.", typeof Peer === "undefined");
    show("scr-lobby");
  }
  function lobbyOptLabel() { $("lbl-lv").textContent = L.mode === "pvp" ? D.WORLDS[L.world].vi : "Màn " + lvlLabel(L.level) + " · " + D.WORLDS[worldOf(L.level)].vi; }
  $("lv-down").onclick = function () { if (L.mode === "pvp") L.world = (L.world + D.WORLDS.length - 1) % D.WORLDS.length; else L.level = Math.max(1, L.level - 1); lobbyOptLabel(); Sfx.play("click"); };
  $("lv-up").onclick = function () { if (L.mode === "pvp") L.world = (L.world + 1) % D.WORLDS.length; else L.level = Math.min(Math.min(D.LEVEL_COUNT, store.cleared + 1), L.level + 1); lobbyOptLabel(); Sfx.play("click"); };
  $("role-hero").onclick = function () { L.role = "hero"; this.classList.add("on"); $("role-shadow").classList.remove("on"); renderLobby(); Net.send({ t: "lobby", players: Net.lobby, role: L.role }); };
  $("role-shadow").onclick = function () { L.role = "shadow"; this.classList.add("on"); $("role-hero").classList.remove("on"); renderLobby(); Net.send({ t: "lobby", players: Net.lobby, role: L.role }); };

  function showCode(code) {
    var h = ""; for (var i = 0; i < code.length; i++) h += "<span>" + code.charAt(i) + "</span>";
    $("code-tiles").innerHTML = h; $("lobby-choose").classList.add("hidden"); $("lobby-room").classList.remove("hidden");
  }
  function renderLobby(players) {
    players = players || Net.lobby;
    var h = "";
    players.forEach(function (p, i) {
      var side = L.mode === "pvp" ? (i === 0 ? L.role : (L.role === "hero" ? "shadow" : "hero")) : "hero";
      h += '<div class="lp"><span class="dot" style="background:' + Art.OWNER[i] + '"></span>' + esc(p.name) + "<em>" + (i === 0 ? "chủ phòng" : "đã vào") + (L.mode === "pvp" ? " · " + (side === "hero" ? "🛡️ Hiệp sĩ" : "👹 Bóng đêm") : "") + "</em></div>";
    });
    if (players.length < 2) h += '<div class="lp empty">Đang chờ bạn vào phòng…</div>';
    $("lobby-players").innerHTML = h;
    if (Net.role === "host") $("btn-start").disabled = players.length < 2;
  }

  $("btn-create").onclick = function () {
    if (typeof Peer === "undefined") return; click();
    leaveNet(); Net.role = "host"; Net.lobby = [{ id: 1, name: store.name }];
    status("Đang tạo phòng…"); hostOpen(makeCode(), 0);
  };
  function hostOpen(code, tries) {
    Net.code = code;
    var peer = new Peer(peerId(code), { debug: 0 }); Net.peer = peer;
    peer.on("open", function () {
      showCode(code); status("Phòng đã sẵn sàng. Bạn kia bấm " + (L.mode === "coop" ? "Cùng phe" : "Đối kháng") + " → nhập mã.");
      $("lobby-host-opts").classList.remove("hidden"); lobbyOptLabel(); renderLobby();
    });
    peer.on("connection", function (conn) {
      if (Net.conn && Net.conn.open) { conn.on("open", function () { try { conn.send({ t: "full" }); } catch (e) { } setTimeout(function () { conn.close(); }, 300); }); return; }
      Net.conn = conn;
      conn.on("data", function (d) { hostOnData(conn, d); });
      conn.on("close", function () { if (Net.conn === conn) hostDrop(); });
      conn.on("error", function () { if (Net.conn === conn) hostDrop(); });
    });
    peer.on("disconnected", function () { if (Net.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { } });
    peer.on("error", function (e) {
      if (Net.peer !== peer) return;
      if (e.type === "unavailable-id" && tries < 4) { peer.destroy(); hostOpen(makeCode(), tries + 1); return; }
      if (e.type === "peer-unavailable") return;
      status("Lỗi mạng: " + e.type + ". Kiểm tra Internet rồi thử lại.", true);
    });
  }
  function hostOnData(conn, d) {
    if (!d || typeof d !== "object") return;
    if (d.t === "hello") {
      if (d.mode !== L.mode) { conn.send({ t: "wrongmode", mode: L.mode }); return; }
      Net.lobby = [Net.lobby[0], { id: 2, name: String(d.name || "Bạn").slice(0, 12) }];
      conn.send({ t: "welcome", id: 2 });
      conn.send({ t: "lobby", players: Net.lobby, role: L.role });
      renderLobby(); status("Bạn " + Net.lobby[1].name + " đã vào phòng!");
      Sfx.play("unlock");
    } else if (d.t === "act") {
      if (G && G.battle && d.a) G.battle.act(2, d.a);
    }
  }
  function hostDrop() {
    Net.conn = null; Net.lobby = Net.lobby.slice(0, 1);
    if (G && isOn("scr-game") && !G.over) { banner("Bạn kia đã rời trận", ""); setTimeout(quitGame, 2000); }
    else if (isOn("scr-lobby")) { renderLobby(); status("Bạn kia đã rời phòng."); }
  }
  $("btn-start").onclick = function () { click(); hostStart(L.mode === "pvp" ? L.world : L.level); };
  function hostStart(n) {
    if (!Net.conn || !Net.conn.open) { status("Chưa có bạn trong phòng.", true); return; }
    var host = { id: 1, name: store.name, slot: 0 }, guest = { id: 2, name: Net.lobby[1] ? Net.lobby[1].name : "Bạn", slot: 1 };
    var cfg;
    if (L.mode === "pvp") {
      L.world = n; host.side = L.role; guest.side = L.role === "hero" ? "shadow" : "hero";
      cfg = { mode: "pvp", world: n, pvpTime: 180, players: [host, guest], heroes: D.HERO_ORDER.slice() };
    } else {
      L.level = n; host.side = guest.side = "hero";
      cfg = { mode: "coop", level: n, world: worldOf(n), players: [host, guest], heroes: D.heroesFor(Math.max(store.cleared, n - 1)) };
    }
    Net.send({ t: "start", cfg: cfg });
    startGame(cfg, "host", 1);
  }

  $("in-code").addEventListener("input", function () { this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  $("btn-join").onclick = function () {
    if (typeof Peer === "undefined") return; click();
    var code = $("in-code").value.trim().toUpperCase();
    if (code.length !== 4) { status("Nhập đủ 4 ký tự mã phòng.", true); return; }
    leaveNet(); Net.role = "client"; Net.code = code;
    status("Đang vào phòng " + code + "…");
    var peer = new Peer({ debug: 0 }); Net.peer = peer;
    peer.on("open", function () {
      var conn = peer.connect(peerId(code), { reliable: true }); Net.conn = conn;
      conn.on("open", function () { conn.send({ t: "hello", name: store.name, mode: L.mode }); });
      conn.on("data", clientOnData);
      conn.on("close", function () {
        if (Net.conn !== conn) return;
        if (G && isOn("scr-game")) { banner("Chủ phòng đã rời trận", ""); setTimeout(quitGame, 2000); }
        else status("Mất kết nối với phòng.", true);
      });
    });
    peer.on("error", function (e) {
      if (Net.peer !== peer) return;
      status(e.type === "peer-unavailable" ? "Không thấy phòng " + code + ". Kiểm tra lại mã." : "Lỗi mạng: " + e.type, true);
    });
  };
  function clientOnData(d) {
    if (!d || typeof d !== "object") return;
    if (d.t === "welcome") { showCode(Net.code); $("lobby-wait").classList.remove("hidden"); status("Đã vào phòng!"); Sfx.play("unlock"); }
    else if (d.t === "full") status("Phòng này đã đủ 2 người.", true);
    else if (d.t === "wrongmode") status("Phòng này chơi chế độ " + (d.mode === "coop" ? "Cùng phe" : "Đối kháng") + ". Quay lại và chọn đúng chế độ.", true);
    else if (d.t === "lobby") { L.role = d.role === "hero" ? "hero" : "shadow"; if (isOn("scr-lobby")) renderLobby(d.players); }
    else if (d.t === "start") { startGame(d.cfg, "client", 2); }
    else if (d.t === "snap" && G && G.net === "client") {
      (d.e || []).forEach(handleEvent);
      applyView(d.v);
    }
  }

  // Nút Quay lại của Android: trả true nếu game tự xử lý, false để thoát app
  window.__back = function () {
    if (isOn("scr-game") && G) {
      if (!$("result").classList.contains("hidden")) { quitGame(); return true; }
      if (!$("pause").classList.contains("hidden")) { $("btn-resume").click(); return true; }
      if (!G.over) { $("btn-pause").click(); return true; }
      quitGame(); return true;
    }
    if (isOn("scr-lobby")) { $("btn-lobby-back").click(); return true; }
    if (!isOn("scr-home")) { show("scr-home"); return true; }
    return false;
  };
  // Rời app khi đang chơi một mình thì tự tạm dừng
  window.__pause = function () { if (G && G.net === "local" && !G.over && !G.paused && isOn("scr-game")) $("btn-pause").click(); };

  refreshHome();
  window.__bk = { store: store, get G() { return G; }, startSolo: startSolo, board: board };
})();
