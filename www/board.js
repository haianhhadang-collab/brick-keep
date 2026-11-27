// Brick Keep: bảng chữ ẩn từ (kéo qua các ô theo đường thẳng để chọn từ).
(function () {
  "use strict";
  var FILL = "aaaabbccddeeeeeffgghhiiiijkllmmnnnoooopprrrssstttuuvwyz";

  function shuffle(a, R) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor((R || Math.random)() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function WordBoard(opts) {
    this.o = opts;
    this.size = 6; // đổi theo màn khi sinh bảng (D.boardSpec)
    this.grid = []; this.words = []; this.sel = []; this.anchor = null; this.dragging = false;
    this.el = opts.gridEl; this.cluesEl = opts.cluesEl;
    this.colors = ["#F6C445", "#7ED4F2", "#F59AC0", "#9EE07A", "#C9A5FF", "#FFAE6B", "#7CE6C8"];
    this.busy = false;
    this._bind();
  }

  // Lấy từ của chủ đề theo độ dài của màn; thiếu thì nới độ dài, vẫn thiếu mới mượn chủ đề khác.
  WordBoard.prototype.pool = function (spec, size) {
    var topic = this.o.topic(), need = spec.count + 3;
    var fits = function (lo, hi) { return function (w) { var n = w[0].length; return /^[a-z]+$/.test(w[0]) && n >= lo && n <= hi && n <= size; }; };
    var lo = spec.min, hi = spec.max, list = topic.words.filter(fits(lo, hi));
    while (list.length < need && (lo > 3 || hi < size)) {
      if (lo > 3) lo--; else hi++;
      list = topic.words.filter(fits(lo, hi));
    }
    if (list.length < need) window.TOPICS.forEach(function (t) { if (t !== topic) t.words.filter(fits(spec.min, spec.max)).forEach(function (w) { list.push(w); }); });
    return list;
  };

  // Số ô mỗi cạnh: theo màn, nhưng thu nhỏ nếu bảng trên màn hình quá hẹp (mỗi ô tối thiểu khoảng 30 px)
  WordBoard.prototype._fitSize = function (want) {
    var w = this.el.clientWidth;
    if (!w || w < 120) return want; // chưa dựng xong khung (màn hình ẩn) thì theo màn
    return Math.max(6, Math.min(want, Math.floor(w / 30)));
  };

  WordBoard.prototype.generate = function () {
    var level = this.o.level(), spec = D.boardSpec(level);
    var size = this.size = this._fitSize(spec.size);
    var dirs = D.boardDirs(level);
    var want = Math.min(spec.count, size + 1);
    var g = [], i, j;
    for (i = 0; i < size; i++) { g.push([]); for (j = 0; j < size; j++) g[i].push(""); }
    var cand = shuffle(this.pool(spec, size).slice());
    // ưu tiên từ chưa gặp gần đây; trong nhóm được chọn, đặt từ dài trước cho dễ xếp
    var recent = this.recent || [];
    cand.sort(function (a, b) { return (recent.indexOf(a[0]) >= 0) - (recent.indexOf(b[0]) >= 0); });
    var head = cand.slice(0, want).sort(function (a, b) { return b[0].length - a[0].length; });
    cand = head.concat(cand.slice(want));
    var placed = [];
    for (var k = 0; k < cand.length && placed.length < want; k++) {
      var w = cand[k][0];
      if (placed.some(function (p) { return p.en === w; })) continue;
      // tránh từ nằm gọn trong từ khác (vd. "car" trong "carrot") để không bị tìm nhầm
      if (placed.some(function (p) { return p.en.indexOf(w) >= 0 || w.indexOf(p.en) >= 0; })) continue;
      var done = false;
      for (var tries = 0; tries < 160 && !done; tries++) {
        var d = dirs[Math.floor(Math.random() * dirs.length)];
        var r0 = Math.floor(Math.random() * size), c0 = Math.floor(Math.random() * size);
        var r1 = r0 + d[1] * (w.length - 1), c1 = c0 + d[0] * (w.length - 1);
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
        var fit = true, cells = [];
        for (var n = 0; n < w.length; n++) {
          var rr = r0 + d[1] * n, cc = c0 + d[0] * n, ch = g[rr][cc];
          if (ch && ch !== w.charAt(n)) { fit = false; break; }
          cells.push([rr, cc]);
        }
        if (!fit) continue;
        cells.forEach(function (p, n) { g[p[0]][p[1]] = w.charAt(n); });
        placed.push({ en: w, vi: cand[k][1], icon: cand[k][2], cells: cells, found: false });
        done = true;
      }
    }
    for (i = 0; i < size; i++) for (j = 0; j < size; j++) if (!g[i][j]) g[i][j] = FILL.charAt(Math.floor(Math.random() * FILL.length));
    if (placed.length) placed[Math.floor(Math.random() * placed.length)].power = true;
    this.grid = g; this.words = placed; this.sel = []; this.anchor = null;
    this.recent = placed.map(function (p) { return p.en; }).concat(recent).slice(0, 24);
    this.render(true);
  };

  WordBoard.prototype.render = function (fresh) {
    var size = this.size, h = "";
    this.el.style.setProperty("--n", size);
    for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) {
      var ch = this.grid[r][c];
      h += '<div class="tile' + (fresh ? " deal" : "") + '" data-r="' + r + '" data-c="' + c + '" style="animation-delay:' + ((r + c) * 0.035).toFixed(3) + 's"><b>' + ch.toUpperCase() + "</b><i>" + (D.LETTER_PTS[ch] || 1) + "</i></div>";
    }
    this.el.innerHTML = h;
    this.tiles = this.el.querySelectorAll(".tile");
    this.renderClues();
  };

  WordBoard.prototype.tile = function (r, c) { return this.tiles[r * this.size + c]; };

  WordBoard.prototype.renderClues = function () {
    var showEn = this.o.showEnglish(), h = "";
    this.words.forEach(function (w) {
      var open = w.found || showEn, blanks = open ? w.en.toUpperCase() : w.en.replace(/./g, "_");
      h += '<div class="clue' + (w.found ? " found" : "") + (w.power ? " power" : "") + '"><span class="ic">' + w.icon + '</span><span class="tx"><b' + (open ? "" : ' class="blank"') + ">" + blanks + "</b><small>" + w.vi + "</small></span>" + (w.power ? '<span class="pw" title="Từ phép thuật">✦</span>' : "") + "</div>";
    });
    this.cluesEl.innerHTML = h;
  };

  WordBoard.prototype._cellAt = function (x, y) {
    var b = this.el.getBoundingClientRect();
    var c = Math.floor((x - b.left) / b.width * this.size), r = Math.floor((y - b.top) / b.height * this.size);
    if (r < 0 || c < 0 || r >= this.size || c >= this.size) return null;
    return [r, c];
  };

  WordBoard.prototype._line = function (a, b) {
    var dr = b[0] - a[0], dc = b[1] - a[1];
    if (!dr && !dc) return [a];
    if (dr && dc && Math.abs(dr) !== Math.abs(dc)) { // bẻ về hướng gần nhất trong 8 hướng
      var ang = Math.atan2(dr, dc), step = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
      var len = Math.max(Math.abs(dr), Math.abs(dc));
      dr = Math.round(Math.sin(step)) * len; dc = Math.round(Math.cos(step)) * len;
    }
    var n = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), out = [];
    for (var i = 0; i <= n; i++) {
      var r = a[0] + sr * i, c = a[1] + sc * i;
      if (r < 0 || c < 0 || r >= this.size || c >= this.size) break;
      out.push([r, c]);
    }
    return out;
  };

  WordBoard.prototype._show = function () {
    var self = this;
    this.tiles.forEach(function (t) { t.classList.remove("sel"); });
    this.sel.forEach(function (p, i) { var t = self.tile(p[0], p[1]); if (t) { t.classList.add("sel"); t.style.setProperty("--i", i); } });
    if (this.o.onPreview) this.o.onPreview(this.sel.map(function (p) { return self.grid[p[0]][p[1]]; }).join(""));
  };

  WordBoard.prototype._bind = function () {
    var self = this, el = this.el;
    el.addEventListener("pointerdown", function (e) {
      if (self.busy || self.o.locked()) return;
      var cell = self._cellAt(e.clientX, e.clientY); if (!cell) return;
      e.preventDefault();
      if (self.anchor && (self.anchor[0] !== cell[0] || self.anchor[1] !== cell[1])) {
        // chế độ chạm–chạm: chạm chữ đầu, rồi chạm chữ cuối
        self.sel = self._line(self.anchor, cell); self.anchor = null; self._show();
        self.o.onStep && self.o.onStep(self.sel.length);
        self._commit(); return;
      }
      self.dragging = true; self.start = cell; self.sel = [cell]; self._show();
      self.o.onStep && self.o.onStep(1);
      try { el.setPointerCapture(e.pointerId); } catch (er) { }
    });
    el.addEventListener("pointermove", function (e) {
      if (!self.dragging) return;
      var cell = self._cellAt(e.clientX, e.clientY); if (!cell) return;
      var line = self._line(self.start, cell);
      if (line.length !== self.sel.length || line[line.length - 1][0] !== self.sel[self.sel.length - 1][0] || line[line.length - 1][1] !== self.sel[self.sel.length - 1][1]) {
        var grow = line.length > self.sel.length;
        self.sel = line; self._show();
        if (grow && self.o.onStep) self.o.onStep(line.length);
      }
    });
    var up = function () {
      if (!self.dragging) return;
      self.dragging = false;
      if (self.sel.length === 1) { self.anchor = self.sel[0]; self.tile(self.anchor[0], self.anchor[1]).classList.add("anchor"); return; }
      self._commit();
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  WordBoard.prototype._clearAnchor = function () { this.tiles.forEach(function (t) { t.classList.remove("anchor"); }); this.anchor = null; };

  WordBoard.prototype._commit = function () {
    var self = this, s = this.sel.map(function (p) { return self.grid[p[0]][p[1]]; }).join("");
    var rev = s.split("").reverse().join("");
    this._clearAnchor();
    var hit = null;
    this.words.forEach(function (w) { if (!hit && !w.found && (w.en === s || w.en === rev)) hit = w; });
    var cells = this.sel.slice();
    this.sel = []; this._show();
    if (this.o.onPreview) this.o.onPreview("");
    if (s.length < 2) return;
    if (hit) {
      hit.found = true;
      var col = this.colors[this.words.indexOf(hit) % this.colors.length];
      var rects = [];
      cells.forEach(function (p, i) {
        var t = self.tile(p[0], p[1]);
        t.classList.remove("hint"); t.classList.add("found", "pop"); t.style.setProperty("--fc", col); t.style.setProperty("--i", i);
        rects.push(t.getBoundingClientRect());
        setTimeout(function () { t.classList.remove("pop"); }, 600);
      });
      this.renderClues();
      this.o.onFound(hit, rects);
      if (this.words.every(function (w) { return w.found; })) {
        this.busy = true;
        setTimeout(function () {
          self.el.classList.add("flip");
          setTimeout(function () { self.el.classList.remove("flip"); self.busy = false; self.generate(); self.o.onNewBoard && self.o.onNewBoard(true); }, 380);
        }, 900);
      }
    } else {
      cells.forEach(function (p) { var t = self.tile(p[0], p[1]); t.classList.add("bad"); setTimeout(function () { t.classList.remove("bad"); }, 450); });
      this.o.onWrong && this.o.onWrong(s);
    }
  };

  // Gợi ý: soi sáng chữ đầu của một từ còn ẩn
  WordBoard.prototype.hint = function () {
    var left = this.words.filter(function (w) { return !w.found; });
    if (!left.length) return false;
    var w = left[Math.floor(Math.random() * left.length)];
    var p = w.cells[0], t = this.tile(p[0], p[1]);
    t.classList.remove("hint"); void t.offsetWidth; t.classList.add("hint");
    return true;
  };

  WordBoard.prototype.reshuffle = function () {
    var self = this; this.busy = true; this.el.classList.add("flip");
    setTimeout(function () { self.el.classList.remove("flip"); self.busy = false; self.generate(); }, 380);
  };

  window.WordBoard = WordBoard;
})();
