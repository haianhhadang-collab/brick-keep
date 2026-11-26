// Brick Keep: mô phỏng trận đấu (chạy ở máy chủ trận: máy chơi một mình hoặc máy tạo phòng).
// Mọi thao tác của người chơi đi qua Battle.act(); trạng thái gửi đi bằng Battle.view().
(function () {
  "use strict";
  var COLS = D.COLS, LANES = D.LANES;

  function Battle(cfg) {
    this.cfg = cfg;
    this.mode = cfg.mode;               // "solo" | "coop" | "pvp"
    this.t = 0; this.nid = 1;
    this.heroes = []; this.mons = []; this.projs = []; this.sweeps = [];
    this.wards = []; for (var i = 0; i < LANES; i++) this.wards.push(1);
    this.ev = []; this.result = null;
    this.players = {};
    var self = this;
    cfg.players.forEach(function (p) {
      self.players[p.id] = { id: p.id, side: p.side, slot: p.slot || 0, name: p.name, bricks: cfg.mode === "pvp" ? 150 : 150, cds: {}, words: 0 };
    });
    this.allowed = cfg.heroes || D.HERO_ORDER;
    if (this.mode === "pvp") {
      this.duration = cfg.pvpTime || 180;
      this.flags = [0.5, 1];
      this.botT = 0;
    } else {
      this.script = D.buildLevel(cfg.level, this.mode === "coop");
      this.si = 0; this.fi = 0;
      this.flags = this.script.flags.map(function (f) { return f / self.script.end; });
    }
  }

  Battle.prototype.emit = function (k, o) { o = o || {}; o.k = k; this.ev.push(o); };

  Battle.prototype.heroAt = function (lane, col) {
    for (var i = 0; i < this.heroes.length; i++) { var h = this.heroes[i]; if (h.lane === lane && h.col === col) return h; }
    return null;
  };

  Battle.prototype.spawn = function (type, lane, x, owner) {
    var M = D.MONS[type];
    var m = { id: this.nid++, type: type, lane: lane, x: x == null ? COLS + 0.6 : x, hp: M.hp, max: M.hp, armor: M.armor || 0, armorMax: M.armor || 0,
      slowT: 0, jumped: false, jumpT: 0, eating: false, chompT: 0, summonT: 6, owner: owner || 0, hitT: 0 };
    this.mons.push(m);
    this.emit("spawn", { type: type, lane: lane });
    return m;
  };

  // ---- Thao tác của người chơi ----
  Battle.prototype.act = function (pid, a) {
    var P = this.players[pid];
    if (!P || this.result || !a) return;
    var deny = function (why) { this.emit("deny", { pid: pid, why: why }); }.bind(this);
    if (a.a === "word") {
      var w = String(a.w || "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);
      if (w.length < 2) return;
      var g = D.wordGain(w);
      P.bricks = Math.min(9999, P.bricks + g); P.words++;
      this.emit("gain", { pid: pid, n: g, w: w });
      if (a.power) this.power(pid);
    } else if (a.a === "place") {
      var H = D.HEROES[a.hero];
      var lane = a.lane | 0, col = a.col | 0;
      if (!H || P.side !== "hero" || this.allowed.indexOf(a.hero) < 0) return;
      if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return;
      if (this.heroAt(lane, col)) return deny("busy");
      if ((P.cds[a.hero] || 0) > this.t) return deny("cd");
      if (P.bricks < H.cost) return deny("bricks");
      P.bricks -= H.cost; P.cds[a.hero] = this.t + H.cd;
      var h = { id: this.nid++, type: a.hero, lane: lane, col: col, x: col + 0.5, hp: H.hp, max: H.hp, owner: pid,
        timer: a.hero === "sage" ? 6 : 0.4, fuse: H.fuse || 0, atkT: 0, hitT: 0 };
      this.heroes.push(h);
      this.emit("place", { lane: lane, col: col, type: a.hero, pid: pid });
    } else if (a.a === "remove") {
      var hh = this.heroAt(a.lane | 0, a.col | 0);
      if (!hh || P.side !== "hero" || (this.mode !== "solo" && hh.owner !== pid)) return;
      this.heroes.splice(this.heroes.indexOf(hh), 1);
      this.emit("remove", { lane: hh.lane, col: hh.col });
    } else if (a.a === "summon") {
      var M = D.MONS[a.mon], ln = a.lane | 0;
      if (!M || P.side !== "shadow" || D.SHADOW_CARDS.indexOf(a.mon) < 0 || ln < 0 || ln >= LANES) return;
      if ((P.cds[a.mon] || 0) > this.t) return deny("cd");
      if (P.bricks < M.cost) return deny("bricks");
      P.bricks -= M.cost; P.cds[a.mon] = this.t + M.cd;
      this.spawn(a.mon, ln, null, pid);
    }
  };

  // Từ phép thuật
  Battle.prototype.power = function (pid) {
    var P = this.players[pid], self = this;
    if (P.side === "hero") {
      this.emit("starfall", { pid: pid });
      this.mons.forEach(function (m) { self.damage(m, 160, "star"); });
    } else {
      this.emit("howl", { pid: pid });
      for (var i = 0; i < 3; i++) this.spawn("imp", Math.floor(Math.random() * LANES), COLS + 0.4 + i * 0.3, pid);
    }
  };

  Battle.prototype.damage = function (m, d, kind) {
    if (m.hp <= 0) return;
    if (m.armor > 0) {
      var a = Math.min(m.armor, d); m.armor -= a; d -= a;
      if (m.armor <= 0) this.emit("armorbreak", { lane: m.lane, x: m.x, type: m.type });
    }
    m.hp -= d; m.hitT = 0.12;
    if (m.hp <= 0) {
      this.emit("die", { lane: m.lane, x: m.x, type: m.type, kind: kind });
      if (this.mode !== "pvp" && Math.random() < 0.25) { // rơi gạch thưởng cho mọi người phe hiệp sĩ
        for (var id in this.players) if (this.players[id].side === "hero") this.players[id].bricks += 10;
        this.emit("drop", { lane: m.lane, x: m.x, n: 10 });
      }
    }
  };

  Battle.prototype.firstMon = function (lane, fromX, maxX) {
    var best = null;
    for (var i = 0; i < this.mons.length; i++) {
      var m = this.mons[i];
      if (m.lane !== lane || m.hp <= 0 || m.x < fromX || m.x > maxX) continue;
      if (!best || m.x < best.x) best = m;
    }
    return best;
  };

  Battle.prototype.update = function (dt) {
    if (this.result) return;
    var self = this, i, j;
    this.t += dt;
    var t = this.t;

    // Lịch quái
    if (this.script) {
      var sc = this.script;
      while (this.si < sc.events.length && sc.events[this.si].t <= t) {
        var e = sc.events[this.si++];
        this.spawn(e.mon, e.lane);
        if (e.mon === "boss") this.emit("boss", {});
      }
      if (this.fi < sc.flags.length && t >= sc.flags[this.fi] - 3) { this.fi++; this.emit("bigwave", { last: this.fi === sc.flags.length }); }
    } else if (this.mode === "pvp") {
      if (Math.floor((t - dt) / (this.duration / 2)) !== Math.floor(t / (this.duration / 2)) && t < this.duration) this.emit("bigwave", { last: true });
      // phe bóng đêm được thêm chút gạch theo thời gian để trận sôi động
      for (var pid in this.players) { var P = this.players[pid]; P.trickle = (P.trickle || 0) + dt; if (P.trickle >= 10) { P.trickle = 0; P.bricks += 10; } }
      if (t >= this.duration) { this.result = "hero"; this.emit("end", { result: "hero" }); return; }
    }

    // Quân phòng thủ
    for (i = this.heroes.length - 1; i >= 0; i--) {
      var h = this.heroes[i], H = D.HEROES[h.type];
      h.atkT = Math.max(0, h.atkT - dt); h.hitT = Math.max(0, h.hitT - dt);
      if (h.type === "bomber") {
        h.fuse -= dt;
        if (h.fuse <= 0) {
          this.emit("boom", { lane: h.lane, x: h.x, big: true });
          this.mons.forEach(function (m) { if (Math.abs(m.lane - h.lane) <= 1 && Math.abs(m.x - h.x) <= 1.5) self.damage(m, H.dmg, "boom"); });
          this.heroes.splice(i, 1);
        }
        continue;
      }
      if (h.type === "sage") {
        h.timer -= dt;
        if (h.timer <= 0) {
          h.timer = H.rate; h.atkT = 0.6;
          var P2 = this.players[h.owner]; if (P2) P2.bricks += 25;
          this.emit("hint", { pid: h.owner, lane: h.lane, x: h.x });
        }
        continue;
      }
      if (!H.rate) continue;
      h.timer -= dt;
      if (h.timer > 0) continue;
      var target = this.firstMon(h.lane, h.x - 0.3, COLS + 0.2);
      if (!target) continue;
      h.timer = H.rate; h.atkT = 0.3;
      if (H.proj === "brick") {
        var dur = 0.9, tx = Math.max(h.x + 0.5, target.x - D.MONS[target.type].spd * dur);
        this.projs.push({ id: this.nid++, kind: "brick", lane: h.lane, x: h.x, x0: h.x, tx: tx, tt: 0, dur: dur, dmg: H.dmg, splash: H.splash, h: 0 });
      } else {
        var n = H.shots || 1;
        for (j = 0; j < n; j++) this.projs.push({ id: this.nid++, kind: H.proj, lane: h.lane, x: h.x + 0.2 - j * 0.32, dmg: H.dmg, splash: H.splash || 0, h: 0 });
      }
      this.emit("shoot", { kind: H.proj, lane: h.lane, x: h.x });
    }

    // Đạn
    for (i = this.projs.length - 1; i >= 0; i--) {
      var p = this.projs[i], hit = null;
      if (p.kind === "brick") {
        p.tt += dt / p.dur; p.x = p.x0 + (p.tx - p.x0) * Math.min(1, p.tt); p.h = Math.sin(Math.min(1, p.tt) * Math.PI);
        if (p.tt >= 1) {
          this.emit("thud", { lane: p.lane, x: p.x });
          this.mons.forEach(function (m) { if (m.lane === p.lane && Math.abs(m.x - p.x) <= p.splash) self.damage(m, p.dmg, "brick"); });
          this.projs.splice(i, 1);
        }
        continue;
      }
      p.x += 6 * dt;
      for (j = 0; j < this.mons.length; j++) {
        var m = this.mons[j];
        if (m.lane === p.lane && m.hp > 0 && m.x - p.x < 0.15 && m.x - p.x > -0.6 && m.jumpT <= 0) { if (!hit || m.x < hit.x) hit = m; }
      }
      if (hit) {
        this.damage(hit, p.dmg, p.kind);
        if (p.kind === "frost") hit.slowT = 4;
        if (p.splash) this.mons.forEach(function (m) { if (m !== hit && m.lane === p.lane && Math.abs(m.x - hit.x) <= p.splash) self.damage(m, p.dmg * 0.5, "fire"); });
        this.emit("hit", { kind: p.kind, lane: p.lane, x: hit.x, armor: hit.armor > 0, type: hit.type });
        this.projs.splice(i, 1);
      } else if (p.x > COLS + 1) this.projs.splice(i, 1);
    }

    // Sóng quét của đá bùa
    for (i = this.sweeps.length - 1; i >= 0; i--) {
      var s = this.sweeps[i]; s.x += 7 * dt;
      this.mons.forEach(function (m) { if (m.lane === s.lane && m.x <= s.x + 0.3 && m.hp > 0) self.damage(m, 99999, "ward"); });
      if (s.x > COLS + 1) this.sweeps.splice(i, 1);
    }

    // Quái
    for (i = this.mons.length - 1; i >= 0; i--) {
      var mo = this.mons[i], M = D.MONS[mo.type];
      if (mo.hp <= 0) { this.mons.splice(i, 1); continue; }
      mo.hitT = Math.max(0, mo.hitT - dt);
      var f = mo.slowT > 0 ? 0.5 : 1; mo.slowT = Math.max(0, mo.slowT - dt);
      if (mo.type === "boss") {
        mo.summonT -= dt;
        if (mo.summonT <= 0 && mo.x < COLS) {
          mo.summonT = 9; this.emit("roar", { lane: mo.lane, x: mo.x });
          [mo.lane - 1, mo.lane + 1].forEach(function (l) { if (l >= 0 && l < LANES) self.spawn("imp", l, mo.x + 0.3); });
        }
      }
      if (mo.jumpT > 0) { mo.jumpT -= dt; mo.x -= 2.2 * dt; mo.eating = false; }
      else if (M.ghost) { mo.x -= M.spd * f * dt; }
      else {
        var blk = null;
        for (j = 0; j < this.heroes.length; j++) {
          var hb = this.heroes[j];
          if (hb.lane === mo.lane && hb.x < mo.x + 0.1 && mo.x - hb.x < 0.5 * (M.big || 1) + 0.05) { if (!blk || hb.x > blk.x) blk = hb; }
        }
        if (blk && M.jumper && !mo.jumped) { mo.jumped = true; mo.jumpT = 0.55; this.emit("jump", { lane: mo.lane, x: mo.x }); }
        else if (blk) {
          mo.eating = true;
          blk.hp -= M.dps * f * dt; blk.hitT = 0.1;
          mo.chompT -= dt;
          if (mo.chompT <= 0) { mo.chompT = M.big ? 0.9 : 0.55; this.emit("chomp", { lane: mo.lane, x: blk.x, big: !!M.big }); }
          if (blk.hp <= 0) {
            this.heroes.splice(this.heroes.indexOf(blk), 1);
            this.emit("herodie", { lane: blk.lane, x: blk.x, type: blk.type });
          }
        } else { mo.eating = false; mo.x -= M.spd * f * dt; }
      }
      if (mo.x < -0.2) {
        if (this.wards[mo.lane]) {
          this.wards[mo.lane] = 0;
          this.sweeps.push({ lane: mo.lane, x: -0.6 });
          this.emit("ward", { lane: mo.lane });
        } else {
          this.result = this.mode === "pvp" ? "shadow" : "lose";
          this.emit("breach", { lane: mo.lane });
          this.emit("end", { result: this.result });
          return;
        }
      }
    }

    if (this.script && this.si >= this.script.events.length && this.mons.length === 0) {
      this.result = "win"; this.emit("end", { result: "win" });
    }
  };

  Battle.prototype.progress = function () {
    if (this.script) return Math.min(1, this.t / this.script.end);
    return Math.min(1, this.t / this.duration);
  };

  // Trạng thái gọn để vẽ và gửi qua mạng
  Battle.prototype.view = function () {
    var r2 = function (v) { return Math.round(v * 100) / 100; };
    var t = this.t, pl = {};
    for (var id in this.players) {
      var P = this.players[id], cd = {};
      for (var k in P.cds) { var left = P.cds[k] - t; if (left > 0) cd[k] = r2(left / (D.HEROES[k] || D.MONS[k]).cd); }
      pl[id] = { b: Math.floor(P.bricks), cd: cd, side: P.side, slot: P.slot, w: P.words, name: P.name };
    }
    return {
      t: r2(t), r: this.result, pr: r2(this.progress()), fl: this.flags, w: this.wards.slice(), mode: this.mode,
      lvl: this.cfg.level || 0, world: this.script ? this.script.world : (this.cfg.world || 0), dur: this.duration || 0,
      h: this.heroes.map(function (h) { return [h.id, h.type, h.lane, h.col, Math.max(0, Math.round(h.hp / h.max * 100)), h.owner, h.atkT > 0 ? 1 : 0, h.hitT > 0 ? 1 : 0, r2(h.fuse || 0)]; }),
      m: this.mons.map(function (m) { return [m.id, m.type, m.lane, r2(m.x), Math.max(0, Math.round(m.hp / m.max * 100)), m.armorMax ? Math.round(m.armor / m.armorMax * 100) : -1, m.slowT > 0 ? 1 : 0, m.eating ? 1 : 0, m.jumpT > 0 ? 1 : 0, m.hitT > 0 ? 1 : 0]; }),
      p: this.projs.map(function (p) { return [p.id, p.kind, p.lane, r2(p.x), r2(p.h)]; }),
      s: this.sweeps.map(function (s) { return [s.lane, r2(s.x)]; }),
      pl: pl
    };
  };

  Battle.prototype.drain = function () { var e = this.ev; this.ev = []; return e; };

  window.Battle = Battle;
})();
