// Brick Keep: vẽ trận đấu (nội suy vị trí, hạt hiệu ứng, rung màn hình).
(function () {
  "use strict";
  var COLS = D.COLS, LANES = D.LANES;

  function Renderer(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.world = 0; this.bg = null; this.fg = null;
    this.heroes = {}; this.mons = {}; this.projs = {};
    this.parts = []; this.shake = 0; this.flash = 0; this.flashC = "#fff";
    this.view = null; this.ambient = [];
    this.resize();
  }

  Renderer.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.g = Art.geo(r.width, r.height, r.height < 300); this.g.dpr = dpr;
    this.dpr = dpr; this.bg = null;
  };

  Renderer.prototype.setWorld = function (w) { if (w !== this.world) { this.world = w; this.bg = null; } this.ambient = []; };

  Renderer.prototype.reset = function () { this.heroes = {}; this.mons = {}; this.projs = {}; this.parts = []; this.view = null; };

  // Nhận trạng thái mới (từ mô phỏng hoặc từ máy chủ)
  Renderer.prototype.feed = function (v) {
    var self = this, seen = {};
    this.view = v;
    v.h.forEach(function (a) {
      var o = self.heroes[a[0]]; seen[a[0]] = 1;
      if (!o) o = self.heroes[a[0]] = { id: a[0], born: performance.now() };
      o.type = a[1]; o.lane = a[2]; o.col = a[3]; o.hp = a[4]; o.owner = a[5]; o.atk = a[6]; o.hurt = a[7]; o.fuse = a[8];
    });
    for (var k in this.heroes) if (!seen[k]) delete this.heroes[k];
    seen = {};
    v.m.forEach(function (a) {
      var o = self.mons[a[0]]; seen[a[0]] = 1;
      if (!o) o = self.mons[a[0]] = { id: a[0], x: a[3], seed: a[0] * 1.7 };
      o.type = a[1]; o.lane = a[2]; o.tx = a[3]; o.hp = a[4]; o.armor = a[5]; o.slow = a[6]; o.eat = a[7]; o.jump = a[8]; o.hurt = a[9];
      if (o.jump && !o.jumpStart) o.jumpStart = performance.now(); if (!o.jump) o.jumpStart = 0;
    });
    for (k in this.mons) if (!seen[k]) delete this.mons[k];
    seen = {};
    v.p.forEach(function (a) {
      var o = self.projs[a[0]]; seen[a[0]] = 1;
      if (!o) o = self.projs[a[0]] = { id: a[0], x: a[3] };
      o.kind = a[1]; o.lane = a[2]; o.tx = a[3]; o.h = a[4];
    });
    for (k in this.projs) if (!seen[k]) delete this.projs[k];
  };

  // ---------- Hạt ----------
  Renderer.prototype.add = function (p) { if (this.parts.length < 700) this.parts.push(p); };
  Renderer.prototype.burst = function (x, y, n, o) {
    for (var i = 0; i < n; i++) {
      var a = (o.a0 || 0) + Math.random() * (o.spread || Math.PI * 2), sp = (o.sp || 120) * (0.4 + Math.random() * 0.8);
      this.add({ k: o.k || "spark", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.g == null ? 400 : o.g,
        life: 0, max: (o.life || 0.6) * (0.6 + Math.random() * 0.6), s: (o.s || 4) * (0.6 + Math.random() * 0.8), c: o.colors ? o.colors[i % o.colors.length] : (o.c || "#fff"),
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, floor: o.floor });
    }
  };
  Renderer.prototype.text = function (x, y, s, c, size) { this.add({ k: "text", x: x, y: y, vx: 0, vy: -50, g: 0, life: 0, max: 1.1, s: size || 18, c: c || "#fff", txt: s }); };
  Renderer.prototype.ring = function (x, y, r, c, life) { this.add({ k: "ring", x: x, y: y, vx: 0, vy: 0, g: 0, life: 0, max: life || 0.5, s: r, c: c }); };

  Renderer.prototype.pos = function (gx, lane) { return this.g.P(gx, lane); };

  // Hiệu ứng theo sự kiện của trận
  Renderer.prototype.event = function (e) {
    var g = this.g; if (!g) return;
    var P, i;
    switch (e.k) {
      case "place":
        P = this.pos(e.col + 0.5, e.lane);
        this.burst(P.x, P.y, 14, { k: "dust", c: "rgba(255,255,255,.7)", sp: 90, g: -10, life: 0.6, s: 7 * P.s, spread: Math.PI, a0: Math.PI });
        this.burst(P.x, P.y - P.u * 2, 10, { k: "star", colors: ["#FFE45C", "#FFFFFF", "#9BE8FF"], sp: 140, g: 200, life: 0.7, s: 5 * P.s });
        this.ring(P.x, P.y, P.u * 1.8, "#FFF6C0", 0.45);
        break;
      case "shoot":
        P = this.pos(e.x + 0.35, e.lane);
        var sc = e.kind === "frost" ? "#AEEBFF" : e.kind === "fire" ? "#FFB04A" : e.kind === "brick" ? "#DDDDDD" : "#FFF3C0";
        this.burst(P.x, P.y - P.u * 2.4, e.kind === "brick" ? 8 : 4, { k: e.kind === "brick" ? "dust" : "spark", c: sc, sp: 60, g: e.kind === "brick" ? -20 : 0, life: 0.3, s: 3 * P.s });
        break;
      case "hit":
        P = this.pos(e.x, e.lane);
        var hy = P.y - P.u * 2.4;
        if (e.armor) this.burst(P.x, hy, 8, { k: "spark", colors: ["#FFE45C", "#FFFFFF"], sp: 180, life: 0.35, s: 3 });
        else if (e.kind === "frost") this.burst(P.x, hy, 10, { k: "shard", colors: ["#BFF2FF", "#7FD6FF", "#FFFFFF"], sp: 150, life: 0.5, s: 5 * P.s });
        else if (e.kind === "fire") { this.burst(P.x, hy, 14, { k: "ember", colors: ["#FFD23A", "#FF7A2E", "#FF4A2E"], sp: 120, g: -60, life: 0.6, s: 5 * P.s }); this.ring(P.x, hy, P.u * 2, "#FF9A3A", 0.35); }
        else this.burst(P.x, hy, 5, { k: "chip", colors: ["#C9A06A", "#8A6A44"], sp: 120, life: 0.4, s: 3 * P.s });
        break;
      case "armorbreak":
        P = this.pos(e.x, e.lane);
        this.add({ k: "piece", x: P.x, y: P.y - P.u * 4, vx: 80 + Math.random() * 60, vy: -260, g: 700, life: 0, max: 1.2, s: P.u * (e.type === "shield" ? 1.6 : 1.1), c: e.type === "shield" ? "#8A5A34" : "#6E7480", rot: 0, vr: 9, floor: P.y });
        break;
      case "die":
        P = this.pos(e.x, e.lane);
        var L = Art.LOOK[e.type] || Art.LOOK.imp, big = (D.MONS[e.type] && D.MONS[e.type].big) || 1;
        this.burst(P.x, P.y - P.u * 2 * big, Math.round(14 * big), { k: "brick", colors: [L.skin, L.torso, L.legs, L.skin], sp: 220 * Math.sqrt(big), up: 120, g: 800, life: 1.1, s: P.u * 0.55 * Math.sqrt(big), floor: P.y });
        this.burst(P.x, P.y - P.u * 2, 10, { k: "smoke", c: "rgba(120,80,170,.55)", sp: 50, g: -30, life: 0.8, s: P.u * 1.2 });
        this.burst(P.x, P.y - P.u * 3, 8, { k: "star", colors: ["#FFE45C", "#FFFFFF"], sp: 160, g: 100, life: 0.6, s: 5 * P.s });
        if (big > 1.8) { this.shake = Math.max(this.shake, 16); this.flash = 0.6; this.flashC = "#FFF2C0"; }
        break;
      case "herodie":
        P = this.pos(e.x, e.lane);
        var LH = Art.LOOK[e.type] || Art.LOOK.archer;
        this.burst(P.x, P.y - P.u * 2, 14, { k: "brick", colors: [LH.torso, LH.legs, LH.skin, LH.hatC || LH.torso], sp: 200, up: 100, g: 800, life: 1.1, s: P.u * 0.5, floor: P.y });
        this.shake = Math.max(this.shake, 4);
        break;
      case "boom":
        P = this.pos(e.x, e.lane);
        this.flash = 0.8; this.flashC = "#FFE2A0"; this.shake = Math.max(this.shake, 18);
        this.ring(P.x, P.y - P.u, P.u * 9, "#FFD27A", 0.6); this.ring(P.x, P.y - P.u, P.u * 5, "#FFFFFF", 0.4);
        this.burst(P.x, P.y - P.u, 40, { k: "ember", colors: ["#FFF2A0", "#FFB23A", "#FF5A2E", "#A83A2E"], sp: 360, g: 200, life: 0.9, s: 9 * P.s });
        this.burst(P.x, P.y - P.u, 18, { k: "smoke", c: "rgba(60,50,50,.6)", sp: 120, g: -40, life: 1.4, s: P.u * 2 });
        this.burst(P.x, P.y - P.u, 16, { k: "brick", colors: ["#C83A2E", "#5A3A20", "#E8C04A"], sp: 300, up: 200, g: 900, life: 1.2, s: P.u * 0.5, floor: P.y + 6 });
        break;
      case "thud":
        P = this.pos(e.x, e.lane);
        this.ring(P.x, P.y, P.u * 3, "#FFE8C0", 0.4); this.shake = Math.max(this.shake, 5);
        this.burst(P.x, P.y, 12, { k: "dust", c: "rgba(220,200,170,.7)", sp: 140, g: -20, life: 0.7, s: P.u * 0.9, spread: Math.PI, a0: Math.PI });
        this.burst(P.x, P.y - P.u, 8, { k: "brick", colors: ["#C8402E", "#E85A40"], sp: 200, up: 160, g: 900, life: 0.9, s: P.u * 0.4, floor: P.y + 4 });
        break;
      case "ward":
        P = this.pos(-0.45, e.lane);
        this.flash = 0.5; this.flashC = "#B8F0FF"; this.shake = Math.max(this.shake, 10);
        this.burst(P.x, P.y - P.u * 2, 30, { k: "star", colors: ["#9BE8FF", "#FFFFFF", "#C9A5FF"], sp: 260, g: 0, life: 0.9, s: 7 });
        break;
      case "starfall":
        this.flash = 0.6; this.flashC = "#FFF0A0";
        for (i = 0; i < 26; i++) this.add({ k: "fallstar", x: g.w * (0.15 + Math.random() * 0.85), y: -20 - Math.random() * 200, vx: -120, vy: 700 + Math.random() * 200, g: 0, life: 0, max: 1.2, s: 10 + Math.random() * 8, c: "#FFE45C", floor: g.top + Math.random() * (g.bot - g.top) });
        break;
      case "howl":
        this.flash = 0.5; this.flashC = "#8A4AD8";
        break;
      case "roar":
        P = this.pos(e.x, e.lane);
        this.ring(P.x, P.y - P.u * 4, P.u * 10, "#B07AFF", 0.7); this.shake = Math.max(this.shake, 12);
        break;
      case "drop":
        P = this.pos(e.x, e.lane);
        this.text(P.x, P.y - P.u * 4, "+" + e.n + " ▰", "#FFD86A", 16);
        break;
      case "hint":
        P = this.pos(e.x, e.lane);
        this.burst(P.x, P.y - P.u * 4, 12, { k: "star", colors: ["#FFD86A", "#FFF6C0"], sp: 80, g: -60, life: 1, s: 6 });
        this.text(P.x, P.y - P.u * 5, "+25", "#FFD86A", 15);
        break;
      case "jump":
        P = this.pos(e.x, e.lane);
        this.burst(P.x, P.y, 8, { k: "dust", c: "rgba(255,255,255,.6)", sp: 80, g: -10, life: 0.5, s: P.u * 0.8, spread: Math.PI, a0: Math.PI });
        break;
      case "chomp":
        P = this.pos(e.x + 0.2, e.lane);
        this.burst(P.x, P.y - P.u * 2, e.big ? 6 : 3, { k: "chip", colors: ["#DDD", "#AAA", "#F6CF57"], sp: 90, life: 0.4, s: 3 * P.s });
        if (e.big) this.shake = Math.max(this.shake, 3);
        break;
      case "spawn":
        P = this.pos(COLS + 0.6, e.lane);
        this.burst(P.x, P.y - P.u * 1.5, 10, { k: "smoke", c: "rgba(120,60,190,.5)", sp: 60, g: -30, life: 0.9, s: P.u * 1.4 });
        break;
      case "remove":
        P = this.pos(e.col + 0.5, e.lane);
        this.burst(P.x, P.y - P.u, 10, { k: "dust", c: "rgba(255,255,255,.6)", sp: 90, g: -10, life: 0.5, s: P.u * 0.8 });
        break;
    }
  };

  // ---------- Vẽ ----------
  Renderer.prototype.draw = function (t, dt, ui) {
    var ctx = this.ctx, g = this.g; if (!g) return;
    var self = this, i;
    if (!this.bg) { this.bg = Art.background(this.world, g); this.fg = Art.foreground(this.world, g); }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    var sx = 0, sy = 0;
    if (this.shake > 0.3) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; this.shake *= Math.pow(0.02, dt); } else this.shake = 0;
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = "#10141c"; ctx.fillRect(-20, -20, g.w + 40, g.h + 40);
    ctx.drawImage(this.bg.canvas, 0, 0, g.w, g.h);
    Art.ambient(ctx, this.bg, g, t);

    var v = this.view;
    // ô đang chọn
    if (ui && ui.hover) {
      var hv = ui.hover;
      if (ui.mode === "place" || ui.mode === "remove") {
        var q = g.quad(hv.col, hv.col + 1, hv.lane);
        ctx.fillStyle = ui.mode === "remove" ? "rgba(255,90,70,.28)" : (ui.ok ? "rgba(255,250,200,.35)" : "rgba(255,80,60,.3)");
        ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.stroke();
        // dải làn mờ
        var lq = g.quad(hv.col, COLS, hv.lane);
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.moveTo(lq[0][0], lq[0][1]); for (i = 1; i < 4; i++) ctx.lineTo(lq[i][0], lq[i][1]); ctx.closePath(); ctx.fill();
      } else if (ui.mode === "summon") {
        var sq = g.quad(5, COLS + 1.3, hv.lane);
        ctx.fillStyle = "rgba(170,90,255,.28)"; ctx.beginPath(); ctx.moveTo(sq[0][0], sq[0][1]); for (i = 1; i < 4; i++) ctx.lineTo(sq[i][0], sq[i][1]); ctx.closePath(); ctx.fill();
      }
    }

    // đá bùa cuối làn
    for (var l = 0; l < LANES; l++) {
      var Pw = g.P(-0.48, l), on = v ? v.w[l] : 1, uu = Pw.u;
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(Pw.x, Pw.y, uu * 0.9, uu * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = on ? "#8A94A8" : "#4A4A52";
      ctx.beginPath(); ctx.moveTo(Pw.x - uu * 0.65, Pw.y); ctx.lineTo(Pw.x - uu * 0.5, Pw.y - uu * 2.0); ctx.quadraticCurveTo(Pw.x, Pw.y - uu * 2.6, Pw.x + uu * 0.5, Pw.y - uu * 2.0); ctx.lineTo(Pw.x + uu * 0.65, Pw.y); ctx.fill();
      if (on) {
        var gl = 0.6 + 0.4 * Math.sin(t * 2.5 + l);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var rg = ctx.createRadialGradient(Pw.x, Pw.y - uu * 1.3, 1, Pw.x, Pw.y - uu * 1.3, uu * 2.2);
        rg.addColorStop(0, "rgba(120,230,255," + 0.55 * gl + ")"); rg.addColorStop(1, "rgba(120,230,255,0)");
        ctx.fillStyle = rg; ctx.fillRect(Pw.x - uu * 2.5, Pw.y - uu * 3.6, uu * 5, uu * 5); ctx.restore();
        ctx.fillStyle = "rgba(190,250,255," + (0.7 + 0.3 * gl) + ")"; Art.star(ctx, Pw.x, Pw.y - uu * 1.25, uu * 0.42);
      } else { ctx.strokeStyle = "#2A2A30"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Pw.x - uu * 0.2, Pw.y - uu * 2); ctx.lineTo(Pw.x + uu * 0.1, Pw.y - uu * 1.2); ctx.lineTo(Pw.x - uu * 0.1, Pw.y - uu * 0.5); ctx.stroke(); }
    }

    // gom vật để vẽ theo chiều sâu
    var list = [];
    for (var id in this.heroes) { var h = this.heroes[id]; list.push({ z: h.lane * 100 + h.col, k: "h", o: h }); }
    for (id in this.mons) {
      var m = this.mons[id];
      var f = Math.min(1, dt * (m.jump ? 18 : 12)); m.x += (m.tx - m.x) * f;
      list.push({ z: m.lane * 100 + m.x + 0.5, k: "m", o: m });
    }
    for (id in this.projs) {
      var p = this.projs[id];
      if (p.kind !== "brick") p.x += 6 * dt;
      p.x += (p.tx - p.x) * Math.min(1, dt * 10);
      list.push({ z: p.lane * 100 + 60, k: "p", o: p });
    }
    list.sort(function (a, b) { return a.z - b.z; });
    var now = performance.now();
    list.forEach(function (it) {
      var o = it.o, P;
      if (it.k === "h") {
        P = g.P(o.col + 0.5, o.lane);
        var grow = Math.min(1, (now - o.born) / 220), sc = 0.6 + 0.4 * grow + Math.sin(grow * Math.PI) * 0.15;
        var plate = v && v.mode !== "solo" ? Art.OWNER[(v.pl[o.owner] && v.pl[o.owner].slot) || 0] : "#6E7B8A";
        Art.fig(ctx, o.type, P.x, P.y, P.u * sc, 1, t, { atk: o.atk, hurt: o.hurt, seed: o.id, plate: plate, hpPct: o.hp, fuse: o.fuse });
        if (o.hp < 100 && o.type !== "bomber") self.bar(P.x, P.y - P.u * 4.9, P.u * 1.8, o.hp / 100, "#7CE36A");
      } else if (it.k === "m") {
        P = g.P(o.x, o.lane);
        var js = o.jumpStart ? (now - o.jumpStart) / 550 : 0;
        var M = D.MONS[o.type];
        Art.fig(ctx, o.type, P.x, P.y, P.u, -1, t, { walk: !o.eat, eat: o.eat, hurt: o.hurt, frozen: o.slow, seed: o.seed, jump: o.jump ? js : 0, armorPct: o.armor, noArmor: o.armor === 0 });
        if (o.slow) { ctx.fillStyle = "rgba(170,230,255,.8)"; for (i = 0; i < 2; i++) Art.star(ctx, P.x + Math.sin(t * 3 + i * 3) * P.u, P.y - P.u * (2 + i * 1.5), P.u * 0.25); }
        if (o.hp < 100 || o.type === "boss") self.bar(P.x, P.y - P.u * 4.9 * (M.big || 1), P.u * 1.9 * (M.big || 1), o.hp / 100, o.type === "boss" ? "#C77DFF" : "#FF6A5A");
      } else {
        P = g.P(o.x, o.lane);
        self.proj(o, P, t);
      }
    });

    // sóng quét của đá bùa
    if (v) v.s.forEach(function (s) {
      var P = g.P(s[1], s[0]), uu = P.u;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      var gr = ctx.createLinearGradient(P.x - uu * 6, 0, P.x + uu, 0);
      gr.addColorStop(0, "rgba(120,230,255,0)"); gr.addColorStop(1, "rgba(160,240,255,.85)");
      ctx.fillStyle = gr; ctx.fillRect(P.x - uu * 6, P.y - uu * 4, uu * 7, uu * 4.4);
      ctx.restore();
      if (Math.random() < 0.6) self.burst(P.x, P.y - uu * Math.random() * 4, 1, { k: "star", c: "#E0FBFF", sp: 40, g: 0, life: 0.5, s: 5 });
    });

    // hạt bay lơ lửng
    this.drawAmbientParticles(ctx, g, t, dt);
    this.drawParts(ctx, dt);
    ctx.restore();
    ctx.drawImage(this.fg, 0, 0, g.w, g.h);
    if (this.flash > 0.01) { ctx.fillStyle = Art.rgba(this.flashC, Math.min(0.6, this.flash * 0.6)); ctx.fillRect(0, 0, g.w, g.h); this.flash *= Math.pow(0.05, dt); }

    // bóng mờ quân đang đặt
    if (ui && ui.hover && ui.mode === "place" && ui.ghost) {
      var GP = g.P(ui.hover.col + 0.5, ui.hover.lane);
      ctx.globalAlpha = 0.55; Art.fig(ctx, ui.ghost, GP.x, GP.y, GP.u, 1, t, {}); ctx.globalAlpha = 1;
    }
  };

  Renderer.prototype.bar = function (x, y, w, f, c) {
    var ctx = this.ctx; f = Math.max(0, Math.min(1, f));
    ctx.fillStyle = "rgba(0,0,0,.55)"; Art.rr(ctx, x - w / 2 - 1, y - 1, w + 2, 6, 3); ctx.fill();
    ctx.fillStyle = c; Art.rr(ctx, x - w / 2, y, w * f, 4, 2); ctx.fill();
  };

  Renderer.prototype.proj = function (o, P, t) {
    var ctx = this.ctx, uu = P.u, y = P.y - uu * 2.5;
    ctx.save();
    if (o.kind === "arrow") {
      ctx.strokeStyle = "#7A4A26"; ctx.lineWidth = Math.max(1.5, uu * 0.12);
      ctx.beginPath(); ctx.moveTo(P.x - uu * 1.1, y); ctx.lineTo(P.x + uu * 0.5, y); ctx.stroke();
      ctx.fillStyle = "#D8D8E0"; ctx.beginPath(); ctx.moveTo(P.x + uu * 0.8, y); ctx.lineTo(P.x + uu * 0.4, y - uu * 0.22); ctx.lineTo(P.x + uu * 0.4, y + uu * 0.22); ctx.fill();
      ctx.fillStyle = "#E8463A"; ctx.beginPath(); ctx.moveTo(P.x - uu * 1.1, y); ctx.lineTo(P.x - uu * 0.7, y - uu * 0.25); ctx.lineTo(P.x - uu * 0.8, y); ctx.lineTo(P.x - uu * 0.7, y + uu * 0.25); ctx.fill();
    } else if (o.kind === "frost" || o.kind === "fire") {
      var c = o.kind === "frost" ? [180, 240, 255] : [255, 160, 60];
      ctx.globalCompositeOperation = "lighter";
      var gr = ctx.createRadialGradient(P.x, y, 1, P.x, y, uu * 1.4);
      gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.3, "rgba(" + c + ",.8)"); gr.addColorStop(1, "rgba(" + c + ",0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(P.x, y, uu * 1.4, 0, Math.PI * 2); ctx.fill();
      for (var i = 1; i < 5; i++) { ctx.fillStyle = "rgba(" + c + "," + (0.5 - i * 0.1) + ")"; ctx.beginPath(); ctx.arc(P.x - i * uu * 0.45, y + Math.sin(t * 20 + i) * uu * 0.15, uu * (0.5 - i * 0.08), 0, Math.PI * 2); ctx.fill(); }
      if (Math.random() < 0.4) this.burst(P.x, y, 1, { k: o.kind === "fire" ? "ember" : "shard", c: o.kind === "fire" ? "#FFB04A" : "#CFF6FF", sp: 30, g: 0, life: 0.35, s: 3 });
    } else if (o.kind === "brick") {
      var by = P.y - uu * 2.2 - o.h * uu * 7;
      ctx.translate(P.x, by); ctx.rotate(t * 8);
      ctx.fillStyle = "#C8402E"; Art.rr(ctx, -uu * 0.6, -uu * 0.35, uu * 1.2, uu * 0.7, uu * 0.1); ctx.fill();
      ctx.fillStyle = "#E86A50"; ctx.beginPath(); ctx.ellipse(-uu * 0.28, -uu * 0.38, uu * 0.18, uu * 0.08, 0, 0, Math.PI * 2); ctx.ellipse(uu * 0.28, -uu * 0.38, uu * 0.18, uu * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  Renderer.prototype.drawAmbientParticles = function (ctx, g, t, dt) {
    var W = D.WORLDS[this.world];
    if (this.ambient.length < 40) this.ambient.push({ x: Math.random() * g.w, y: Math.random() * g.h, ph: Math.random() * 6, s: 1 + Math.random() * 2.5 });
    ctx.save();
    if (W.night) ctx.globalCompositeOperation = "lighter";
    this.ambient.forEach(function (a) {
      if (W.id === "autumn") { a.y += 30 * dt; a.x += Math.sin(t + a.ph) * 30 * dt - 10 * dt; }
      else { a.y += Math.sin(t * 0.7 + a.ph) * 8 * dt - 4 * dt; a.x += Math.cos(t * 0.5 + a.ph) * 10 * dt; }
      if (a.y > g.h + 10) a.y = -10; if (a.y < -10) a.y = g.h; if (a.x < -10) a.x = g.w + 10; if (a.x > g.w + 10) a.x = -10;
      var tw = 0.5 + 0.5 * Math.sin(t * 2 + a.ph * 3);
      if (W.id === "autumn") { ctx.fillStyle = "rgba(230,120,40,.85)"; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(t * 2 + a.ph); ctx.beginPath(); ctx.ellipse(0, 0, a.s * 2.2, a.s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      else if (W.night) { var c = W.id === "glow" ? "160,255,200" : "210,180,255"; var gr = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.s * 5); gr.addColorStop(0, "rgba(" + c + "," + 0.9 * tw + ")"); gr.addColorStop(1, "rgba(" + c + ",0)"); ctx.fillStyle = gr; ctx.fillRect(a.x - a.s * 5, a.y - a.s * 5, a.s * 10, a.s * 10); }
      else { ctx.fillStyle = "rgba(255,250,220," + 0.6 * tw + ")"; ctx.beginPath(); ctx.arc(a.x, a.y, a.s * 0.8, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.restore();
  };

  Renderer.prototype.drawParts = function (ctx, dt) {
    for (var i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i];
      p.life += dt; if (p.life >= p.max) { this.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.floor != null && p.y > p.floor && p.vy > 0) {
        if (p.k === "fallstar") { this.burst(p.x, p.y, 6, { k: "star", colors: ["#FFE45C", "#FFF"], sp: 120, g: 200, life: 0.5, s: 5 }); this.parts.splice(i, 1); continue; }
        p.y = p.floor; p.vy *= -0.35; p.vx *= 0.6; p.vr *= 0.5;
      }
      var a = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
      switch (p.k) {
        case "spark": ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); break;
        case "star": ctx.fillStyle = p.c; Art.star(ctx, p.x, p.y, p.s * (0.5 + a * 0.5)); break;
        case "fallstar":
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,230,120,.6)"; ctx.lineWidth = p.s * 0.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 0.08, p.y - p.vy * 0.08); ctx.stroke(); ctx.restore();
          ctx.fillStyle = p.c; Art.star(ctx, p.x, p.y, p.s); break;
        case "dust": case "smoke":
          ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1.4 - a * 0.6), 0, Math.PI * 2); ctx.fill(); break;
        case "ember":
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * a, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break;
        case "shard": case "chip":
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * 0.4, 0); ctx.lineTo(0, p.s * 0.6); ctx.lineTo(-p.s * 0.4, 0); ctx.fill(); ctx.restore(); break;
        case "brick":
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
          ctx.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); ctx.fillStyle = Art.lit(p.c, 0.25); ctx.fillRect(-p.s * 0.75, -p.s * 0.8, p.s * 0.5, p.s * 0.3); ctx.fillRect(p.s * 0.25, -p.s * 0.8, p.s * 0.5, p.s * 0.3);
          ctx.restore(); break;
        case "piece":
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; Art.rr(ctx, -p.s * 0.6, -p.s * 0.35, p.s * 1.2, p.s * 0.7, p.s * 0.12); ctx.fill(); ctx.restore(); break;
        case "ring":
          ctx.strokeStyle = p.c; ctx.lineWidth = 3 * a + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s * (1 - a) + 4, (p.s * (1 - a) + 4) * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); break;
        case "text":
          ctx.font = "800 " + p.s + "px Fredoka, Nunito, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(40,20,10,.85)";
          ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.c; ctx.fillText(p.txt, p.x, p.y); break;
      }
    }
    ctx.globalAlpha = 1;
  };

  window.Renderer = Renderer;
})();
