// Brick Keep: vẽ cảnh 2,5D (nhiều lớp, ánh sáng cổ tích) và nhân vật khối gạch bằng canvas.
(function () {
  "use strict";
  var COLS = D.COLS, LANES = D.LANES;
  var Art = {};

  // ---------- Màu ----------
  var cache = {};
  function rgb(h) {
    if (cache[h]) return cache[h];
    var m = h.replace("#", ""); if (m.length === 3) m = m.replace(/./g, "$&$&");
    var v = [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
    cache[h] = v; return v;
  }
  function hex(v) { return "#" + v.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); }
  function lit(c, t) { return t > 0 ? mix(c, "#ffffff", t) : mix(c, "#000000", -t); }
  function rgba(c, a) { var v = rgb(c); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")"; }
  Art.mix = mix; Art.lit = lit; Art.rgba = rgba;

  // ---------- Hình học sân 2,5D ----------
  // Làn 0 ở xa (trên), làn 4 ở gần (dưới). Càng gần càng to.
  Art.geo = function (w, h, compact) {
    var g = { w: w, h: h };
    g.top = h * (compact ? 0.30 : 0.33); g.bot = h * 0.975;
    g.sc = function (d) { return 0.72 + 0.28 * d; };
    var hs = [], tot = 0, i;
    for (i = 0; i < LANES; i++) { var s = g.sc((i + 0.5) / LANES); hs.push(s); tot += s; }
    g.edges = [g.top];
    for (i = 0; i < LANES; i++) g.edges.push(g.edges[i] + hs[i] / tot * (g.bot - g.top));
    g.cwF = Math.min(w * 0.84 / (COLS + 0.6), (g.bot - g.top) / LANES * 1.55);
    g.cx = w * 0.5 + g.cwF * 0.55;
    // độ sâu (0..1) theo y
    g.depthY = function (y) { return (y - g.top) / (g.bot - g.top); };
    g.cw = function (d) { return g.cwF * g.sc(d); };
    g.X = function (gx, y) { var d = g.depthY(y); return g.cx + (gx - COLS / 2) * g.cw(d); };
    g.laneY = function (l) { return (g.edges[Math.floor(l)] + g.edges[Math.floor(l) + 1]) / 2 + (g.edges[Math.floor(l) + 1] - g.edges[Math.floor(l)]) * 0.12; };
    g.rowH = function (l) { return g.edges[l + 1] - g.edges[l]; };
    // điểm đứng của một nhân vật ở (x ô, làn)
    g.P = function (gx, lane) { var y = g.laneY(lane); var d = g.depthY(y); return { x: g.cx + (gx - COLS / 2) * g.cw(d), y: y, s: g.sc(d), u: Math.min(g.rowH(lane) * 0.29, g.cw(d) * 0.33) }; };
    g.pick = function (x, y) {
      for (var l = 0; l < LANES; l++) if (y >= g.edges[l] && y < g.edges[l + 1]) {
        var d = g.depthY(y), gx = (x - g.cx) / g.cw(d) + COLS / 2;
        return { lane: l, col: Math.floor(gx), gx: gx };
      }
      return null;
    };
    g.quad = function (x0, x1, l) { // 4 góc của dải ô từ x0 tới x1 trên làn l
      var y0 = g.edges[l], y1 = g.edges[l + 1];
      return [[g.X(x0, y0), y0], [g.X(x1, y0), y0], [g.X(x1, y1), y1], [g.X(x0, y1), y1]];
    };
    return g;
  };

  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  Art.rr = rr;

  // ---------- Các vật trong cảnh ----------
  function cushion(ctx, x, y, rx, ry, col, R) { // tán lá kiểu thông xoắn: nhiều lớp đệm dẹt
    for (var k = 0; k < 3; k++) {
      var ox = (R() - 0.5) * rx * 0.5, oy = -k * ry * 0.35;
      var gr = ctx.createLinearGradient(0, y + oy - ry, 0, y + oy + ry);
      gr.addColorStop(0, lit(col, 0.32)); gr.addColorStop(0.5, col); gr.addColorStop(1, lit(col, -0.35));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(x + ox, y + oy, rx * (1 - k * 0.22), ry * (1 - k * 0.15), 0, 0, Math.PI * 2); ctx.fill();
    }
    // chấm lá sáng
    ctx.fillStyle = rgba(lit(col, 0.5), 0.5);
    for (var i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(x + (R() - 0.5) * rx * 1.4, y - ry * 0.3 + (R() - 0.6) * ry, rx * 0.12, ry * 0.18, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  function pine(ctx, x, y, s, R, bark, leaf) {
    var pts = [], cx = x, cy = y, ang = -Math.PI / 2 + (R() - 0.5) * 0.4;
    for (var i = 0; i < 12; i++) { pts.push([cx, cy]); ang += (R() - 0.5) * 0.55; cx += Math.cos(ang) * s * 0.09; cy += Math.sin(ang) * s * 0.09; }
    ctx.lineCap = "round";
    for (i = 1; i < pts.length; i++) {
      var wdt = s * 0.11 * (1 - i / pts.length * 0.75);
      ctx.strokeStyle = bark; ctx.lineWidth = wdt;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      ctx.strokeStyle = lit(bark, 0.3); ctx.lineWidth = wdt * 0.3;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0] - wdt * 0.25, pts[i - 1][1]); ctx.lineTo(pts[i][0] - wdt * 0.25, pts[i][1]); ctx.stroke();
    }
    var tips = [];
    for (i = 4; i < pts.length; i += 2) {
      var dir = R() < 0.5 ? -1 : 1, len = s * (0.18 + R() * 0.25);
      var ex = pts[i][0] + dir * len, ey = pts[i][1] - len * 0.25;
      ctx.strokeStyle = bark; ctx.lineWidth = s * 0.035;
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.quadraticCurveTo(pts[i][0] + dir * len * 0.5, pts[i][1] + len * 0.1, ex, ey); ctx.stroke();
      tips.push([ex, ey]);
    }
    tips.push(pts[pts.length - 1]);
    tips.forEach(function (p) { cushion(ctx, p[0], p[1], s * (0.16 + R() * 0.1), s * 0.06, leaf, R); });
  }
  function roundTree(ctx, x, y, s, R, bark, leaf) {
    ctx.fillStyle = bark; ctx.beginPath(); ctx.moveTo(x - s * 0.05, y); ctx.lineTo(x - s * 0.025, y - s * 0.55); ctx.lineTo(x + s * 0.025, y - s * 0.55); ctx.lineTo(x + s * 0.05, y); ctx.fill();
    for (var i = 0; i < 7; i++) {
      var bx = x + (R() - 0.5) * s * 0.45, by = y - s * 0.6 - R() * s * 0.35, br = s * (0.14 + R() * 0.1);
      var gr = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.4, br * 0.1, bx, by, br);
      gr.addColorStop(0, lit(leaf, 0.35)); gr.addColorStop(1, lit(leaf, -0.25));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
  }
  function rock(ctx, x, y, w, h, R, col, moss) {
    var pts = [], n = 9;
    for (var i = 0; i <= n; i++) { var a = Math.PI + i / n * Math.PI; pts.push([x + Math.cos(a) * w * (0.85 + R() * 0.2), y + Math.sin(a) * h * (0.8 + R() * 0.25)]); }
    var gr = ctx.createLinearGradient(x - w, y - h, x + w, y);
    gr.addColorStop(0, lit(col, 0.25)); gr.addColorStop(0.6, col); gr.addColorStop(1, lit(col, -0.4));
    ctx.fillStyle = gr; poly(ctx, pts); ctx.fill();
    if (moss) {
      ctx.fillStyle = moss; ctx.beginPath();
      ctx.moveTo(pts[1][0], pts[1][1]);
      for (i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      for (i = n - 1; i >= 1; i--) ctx.lineTo(pts[i][0] + (R() - 0.5) * 4, pts[i][1] + h * (0.12 + R() * 0.12));
      ctx.fill();
    }
    ctx.strokeStyle = rgba(lit(col, -0.5), 0.35); ctx.lineWidth = 1.5;
    for (i = 0; i < 3; i++) { var cx = x + (R() - 0.5) * w, cy = y - R() * h * 0.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (R() - 0.5) * w * 0.3, cy + h * 0.25); ctx.stroke(); }
  }
  function hills(ctx, w, base, amp, col, R, fogTo) {
    var ph = R() * 10, f1 = 2 + R() * 2, f2 = 5 + R() * 4;
    ctx.beginPath(); ctx.moveTo(0, base + amp * 2);
    for (var x = 0; x <= w; x += 6) { var t = x / w; ctx.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(t * f1 * Math.PI + ph) + 0.15 * Math.sin(t * f2 * Math.PI + ph * 2))); }
    ctx.lineTo(w, base + amp * 2); ctx.closePath();
    var gr = ctx.createLinearGradient(0, base - amp, 0, base + amp);
    gr.addColorStop(0, col); gr.addColorStop(1, fogTo || col);
    ctx.fillStyle = gr; ctx.fill();
  }
  function brickWall(ctx, x, y, w, h, col, studs) { // tường gạch có núm
    var bw = Math.max(8, h / 3.2), bh = bw * 0.5;
    ctx.save(); rr(ctx, x, y, w, h, 3); ctx.clip();
    ctx.fillStyle = lit(col, -0.35); ctx.fillRect(x, y, w, h);
    for (var r = 0, yy = y; yy < y + h; r++, yy += bh) {
      for (var xx = x - (r % 2) * bw / 2; xx < x + w; xx += bw) {
        var gr = ctx.createLinearGradient(0, yy, 0, yy + bh);
        gr.addColorStop(0, lit(col, 0.18)); gr.addColorStop(1, lit(col, -0.12));
        ctx.fillStyle = gr; ctx.fillRect(xx + 1, yy + 1, bw - 2, bh - 2);
      }
    }
    ctx.restore();
    if (studs) for (var sx = x + bw * 0.3; sx < x + w - 2; sx += bw * 0.5) stud(ctx, sx + bw * 0.12, y, bw * 0.14, col);
  }
  function stud(ctx, x, y, r, col) {
    ctx.fillStyle = lit(col, -0.15); ctx.fillRect(x - r, y - r * 0.6, r * 2, r * 0.6);
    ctx.fillStyle = lit(col, 0.2); ctx.beginPath(); ctx.ellipse(x, y - r * 0.6, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ---------- Vẽ nền tĩnh (một lần mỗi kích thước) ----------
  Art.background = function (world, g) {
    var W = D.WORLDS[world], w = g.w, h = g.h;
    var cv = document.createElement("canvas"); cv.width = Math.ceil(w * g.dpr); cv.height = Math.ceil(h * g.dpr);
    var ctx = cv.getContext("2d"); ctx.scale(g.dpr, g.dpr);
    var R = D.rng(world * 101 + 7), hz = g.top;
    var anim = { lights: [], mush: [], crystals: [] };
    // bầu trời
    var sky = ctx.createLinearGradient(0, 0, 0, hz + 20);
    sky.addColorStop(0, W.sky[0]); sky.addColorStop(0.55, W.sky[1]); sky.addColorStop(1, W.sky[2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    if (W.night) { // sao
      for (var i = 0; i < 140; i++) { ctx.fillStyle = "rgba(255,255,255," + (0.2 + R() * 0.7) + ")"; var sz = R() * 1.6 + 0.3; ctx.fillRect(R() * w, R() * hz * 0.9, sz, sz); }
    }
    // mặt trời / mặt trăng
    var sunX = W.id === "autumn" ? w * 0.62 : w * 0.72, sunY = W.id === "autumn" ? hz * 0.62 : hz * 0.3;
    var glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, w * 0.35);
    glow.addColorStop(0, rgba(W.light, W.night ? 0.45 : 0.75)); glow.addColorStop(1, rgba(W.light, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    if (W.id === "moon") {
      ctx.fillStyle = "#EDE6FF"; ctx.beginPath(); ctx.arc(sunX, sunY, hz * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(170,150,220,.35)"; [[-.3, -.2, .25], [.25, .1, .18], [-.05, .35, .14]].forEach(function (c) { ctx.beginPath(); ctx.arc(sunX + c[0] * hz * 0.2, sunY + c[1] * hz * 0.2, c[2] * hz * 0.2, 0, Math.PI * 2); ctx.fill(); });
    } else if (!W.night) {
      ctx.fillStyle = rgba(W.light, 0.95); ctx.beginPath(); ctx.arc(sunX, sunY, hz * 0.09, 0, Math.PI * 2); ctx.fill();
    }
    anim.sun = [sunX, sunY];
    // mây
    if (!W.night) for (i = 0; i < 7; i++) {
      var cx = R() * w, cy = hz * (0.12 + R() * 0.5), cs = w * (0.05 + R() * 0.06);
      for (var k = 0; k < 6; k++) {
        var gx = cx + (k - 2.5) * cs * 0.55, gy = cy + Math.sin(k) * cs * 0.15, gr2 = cs * (0.4 + R() * 0.35);
        var cg = ctx.createRadialGradient(gx, gy - gr2 * 0.4, 1, gx, gy, gr2);
        cg.addColorStop(0, "rgba(255,255,255,.95)"); cg.addColorStop(1, rgba(mix(W.sky[1], "#ffffff", 0.6), 0.0));
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(gx, gy, gr2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // núi xa, đồi giữa
    hills(ctx, w, hz * 0.88, hz * 0.32, mix(W.hill[0], W.sky[2], 0.55), R, mix(W.hill[0], W.sky[2], 0.75));
    if (W.id === "meadow") { // hồ xa
      var lake = ctx.createLinearGradient(0, hz * 0.86, 0, hz * 1.02);
      lake.addColorStop(0, "#6FA8E8"); lake.addColorStop(1, "#2D5FB0");
      ctx.fillStyle = lake; ctx.fillRect(0, hz * 0.86, w, hz * 0.2);
      ctx.fillStyle = "rgba(255,255,255,.35)"; for (i = 0; i < 30; i++) ctx.fillRect(R() * w, hz * (0.88 + R() * 0.12), 10 + R() * 30, 1.2);
    }
    if (W.id === "moon") { // tháp lâu đài xa
      ctx.fillStyle = mix(W.hill[1], W.sky[1], 0.35);
      [[0.18, 0.5], [0.26, 0.75], [0.34, 0.42], [0.82, 0.6], [0.9, 0.38]].forEach(function (t) {
        var tx = w * t[0], th = hz * t[1], tw = w * 0.025;
        ctx.fillRect(tx - tw, hz - th, tw * 2, th); ctx.beginPath(); ctx.moveTo(tx - tw * 1.4, hz - th); ctx.lineTo(tx, hz - th - tw * 3); ctx.lineTo(tx + tw * 1.4, hz - th); ctx.fill();
        ctx.fillStyle = "rgba(255,220,140,.8)"; ctx.fillRect(tx - 2, hz - th * 0.7, 4, 6); ctx.fillStyle = mix(W.hill[1], W.sky[1], 0.35);
      });
    }
    hills(ctx, w, hz * 1.02, hz * 0.2, mix(W.hill[0], W.sky[2], 0.2), R, W.hill[1]);
    // phế tích
    if (W.id === "autumn") {
      for (i = 0; i < 5; i++) {
        var px = w * (0.08 + i * 0.21 + R() * 0.05), ph = hz * (0.25 + R() * 0.3), pw = w * 0.022;
        var sg = ctx.createLinearGradient(px - pw, 0, px + pw, 0); sg.addColorStop(0, "#E8C9A0"); sg.addColorStop(1, "#9C7A5A");
        ctx.fillStyle = sg; ctx.fillRect(px - pw, hz + 4 - ph, pw * 2, ph);
        ctx.fillRect(px - pw * 1.4, hz + 4 - ph, pw * 2.8, pw * 0.6);
        if (i % 2 === 0) { ctx.strokeStyle = "#C9A57E"; ctx.lineWidth = pw * 0.9; ctx.beginPath(); ctx.arc(px + w * 0.06, hz + 4 - ph, w * 0.06, Math.PI, Math.PI * 1.55); ctx.stroke(); }
      }
    }
    // dải cây hai bên phía xa
    for (i = 0; i < 12; i++) {
      var tx2 = R() < 0.5 ? R() * w * 0.32 : w * (0.68 + R() * 0.32), ty = hz + 6 + R() * 6, ts = hz * (0.35 + R() * 0.35);
      if (W.id === "autumn") roundTree(ctx, tx2, ty, ts, R, "#5A3A28", ["#E07B2E", "#F2A93B", "#C9512A"][i % 3]);
      else if (W.id === "glow") { ctx.fillStyle = mix(W.hill[1], "#000000", 0.3); ctx.fillRect(tx2 - ts * 0.06, ty - ts * 1.6, ts * 0.12, ts * 1.6); }
      else pine(ctx, tx2, ty, ts * 0.9, R, W.night ? "#2A2440" : "#6A4630", W.night ? "#2F3E5E" : "#4F8A3C");
    }
    // nền cỏ phía sau sân
    var gg = ctx.createLinearGradient(0, hz - 10, 0, h);
    gg.addColorStop(0, lit(W.grassB, -0.15)); gg.addColorStop(1, lit(W.grassB, -0.35));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, hz + 4); ctx.lineTo(w, hz + 4); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

    // ---- sân: 5 làn × 9 ô, dạng tấm nền có núm ----
    for (var l = 0; l < LANES; l++) for (var c = 0; c < COLS; c++) {
      var q = g.quad(c, c + 1, l), alt = (l + c) % 2;
      var base = alt ? W.grassA : W.grassB;
      var tg = ctx.createLinearGradient(0, q[0][1], 0, q[3][1]);
      tg.addColorStop(0, lit(base, 0.1)); tg.addColorStop(1, lit(base, -0.08));
      ctx.fillStyle = tg; poly(ctx, q); ctx.fill();
      // cỏ lấm tấm
      ctx.fillStyle = rgba(lit(base, 0.3), 0.35);
      for (var s = 0; s < 6; s++) { var fx = q[0][0] + (q[1][0] - q[0][0]) * R(), fy = q[0][1] + (q[3][1] - q[0][1]) * R(); ctx.fillRect(fx, fy, 1.5, 3); }
      // núm gạch mờ
      var d0 = g.depthY((q[0][1] + q[3][1]) / 2), sr = g.cw(d0) * 0.07;
      for (var sy = 0; sy < 2; sy++) for (var sx = 0; sx < 2; sx++) {
        var yy = q[0][1] + (q[3][1] - q[0][1]) * (0.3 + sy * 0.42), xx = g.X(c + 0.27 + sx * 0.46, yy);
        ctx.fillStyle = rgba(lit(base, -0.25), 0.35); ctx.beginPath(); ctx.ellipse(xx, yy + sr * 0.25, sr, sr * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(lit(base, 0.25), 0.45); ctx.beginPath(); ctx.ellipse(xx, yy, sr, sr * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // viền đá trước/sau sân
    [[0, -1], [LANES, 1]].forEach(function (e) {
      var y = g.edges[e[0]], x0 = g.X(-1.2, y), x1 = g.X(COLS + 0.2, y), th = (e[1] > 0 ? 9 : 5) * g.sc(g.depthY(y));
      var sg2 = ctx.createLinearGradient(0, y, 0, y + th);
      sg2.addColorStop(0, lit(W.path, 0.25)); sg2.addColorStop(1, lit(W.path, -0.3));
      ctx.fillStyle = sg2; ctx.fillRect(x0, e[1] > 0 ? y - 2 : y - th, x1 - x0, th);
    });
    // lối vào của quái (bên phải): bụi gai tối và sương tím
    for (l = 0; l < LANES; l++) {
      var y0 = g.edges[l], y1 = g.edges[l + 1];
      var pq = [[g.X(COLS, y0), y0], [w + 10, y0], [w + 10, y1], [g.X(COLS, y1), y1]];
      var pg = ctx.createLinearGradient(pq[0][0], 0, w, 0);
      pg.addColorStop(0, lit(W.path, -0.1)); pg.addColorStop(1, lit(W.path, -0.55));
      ctx.fillStyle = pg; poly(ctx, pq); ctx.fill();
    }
    var bx0 = g.X(COLS + 0.55, g.top);
    for (i = 0; i < 26; i++) {
      var by = g.top + R() * (g.bot - g.top), bxx = g.X(COLS + 0.7 + R() * 1.2, by), br3 = g.cwF * (0.25 + R() * 0.3) * g.sc(g.depthY(by));
      ctx.fillStyle = mix("#2A1838", W.hill[1], 0.3);
      ctx.beginPath(); ctx.arc(bxx, by, br3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#1A0E24"; ctx.lineWidth = 2;
      for (var th2 = 0; th2 < 4; th2++) { var a = R() * Math.PI * 2; ctx.beginPath(); ctx.moveTo(bxx + Math.cos(a) * br3 * 0.6, by + Math.sin(a) * br3 * 0.6); ctx.lineTo(bxx + Math.cos(a) * br3 * 1.35, by + Math.sin(a) * br3 * 1.35); ctx.stroke(); }
    }
    anim.portal = [bx0, g.top, w - bx0, g.bot - g.top];
    // tường lâu đài bên trái (gạch có núm)
    var wallC = { meadow: "#C9B48A", glow: "#7F8C86", autumn: "#D3A574", moon: "#7C7FA8" }[W.id];
    for (l = 0; l < LANES; l++) {
      var yA = g.edges[l], yB = g.edges[l + 1], xA = g.X(-1.05, yB), sc2 = g.sc(g.depthY(yB));
      var wh = (yB - yA) * 1.25, ww = g.cwF * 0.42 * sc2;
      brickWall(ctx, xA - ww, yB - wh, ww, wh, wallC, true);
    }
    // tháp lâu đài ở góc trên trái
    var tx3 = g.X(-1.3, g.top), tw3 = g.cwF * 0.9, tH = g.top * 0.95;
    brickWall(ctx, tx3 - tw3, g.top - tH + 8, tw3 * 1.4, tH, wallC, true);
    ctx.fillStyle = "#3B2A20"; rr(ctx, tx3 - tw3 * 0.45, g.top - tH * 0.55, tw3 * 0.5, tH * 0.3, tw3 * 0.25); ctx.fill();
    ctx.fillStyle = W.night ? "rgba(255,210,120,.9)" : "rgba(255,240,200,.6)"; rr(ctx, tx3 - tw3 * 0.38, g.top - tH * 0.5, tw3 * 0.36, tH * 0.2, tw3 * 0.18); ctx.fill();
    ctx.fillStyle = "#4A3A30"; ctx.fillRect(tx3 - tw3 * 0.35, g.top - tH - 30 + 8, 3, 30);
    ctx.fillStyle = "#D8463A"; ctx.beginPath(); ctx.moveTo(tx3 - tw3 * 0.35 + 3, g.top - tH - 28 + 8); ctx.lineTo(tx3 - tw3 * 0.35 + 26, g.top - tH - 20 + 8); ctx.lineTo(tx3 - tw3 * 0.35 + 3, g.top - tH - 12 + 8); ctx.fill();
    anim.flag = [tx3 - tw3 * 0.35 + 3, g.top - tH - 28 + 8];

    // tiền cảnh hai bên: đá rêu và cây lớn
    var mossC = W.night ? "#2F6F55" : "#8BBF45";
    if (W.id !== "glow") {
      pine(ctx, w * 0.98, g.top + 10, g.top * 1.15, R, W.night ? "#2A2236" : "#7A5236", W.night ? "#2E4466" : (W.id === "autumn" ? "#D9862F" : "#5A9A3E"));
    } else {
      for (i = 0; i < 3; i++) { // thân cây to và dây leo
        var tx4 = i === 1 ? w * 0.94 : (i === 0 ? w * 0.03 : w * 0.86), tw4 = w * (0.035 + R() * 0.02);
        var tg2 = ctx.createLinearGradient(tx4 - tw4, 0, tx4 + tw4, 0); tg2.addColorStop(0, "#1C2B26"); tg2.addColorStop(0.4, "#2E4A3E"); tg2.addColorStop(1, "#0E1A16");
        ctx.fillStyle = tg2; ctx.fillRect(tx4 - tw4, 0, tw4 * 2, g.top + 12);
        ctx.strokeStyle = "rgba(60,120,90,.7)"; ctx.lineWidth = 2;
        for (k = 0; k < 4; k++) { var vx = tx4 + (R() - 0.5) * tw4 * 6; ctx.beginPath(); ctx.moveTo(vx, 0); ctx.quadraticCurveTo(vx + 10, g.top * 0.3, vx - 4, g.top * (0.3 + R() * 0.5)); ctx.stroke(); }
      }
      for (i = 0; i < 16; i++) anim.mush.push([R() < 0.5 ? R() * w * 0.2 : w * (0.8 + R() * 0.2), g.top - 4 + R() * 12, 4 + R() * 8, R() * 6]);
    }
    if (W.id === "moon") for (i = 0; i < 7; i++) anim.crystals.push([w * (0.05 + R() * 0.9), g.top - 2 - R() * 8, 6 + R() * 10, R() * 6]);
    rock(ctx, w * 0.06, g.top + 14, w * 0.09, g.top * 0.32, R, W.night ? "#3E4558" : "#9A9384", mossC);
    rock(ctx, w * 0.93, g.top + 16, w * 0.08, g.top * 0.26, R, W.night ? "#3E4558" : "#9A9384", mossC);
    // ánh sáng xiên
    if (!W.night || W.id === "glow") for (i = 0; i < 5; i++) anim.lights.push([w * (0.15 + i * 0.17 + R() * 0.05), w * (0.03 + R() * 0.04), R() * 6]);
    // sương
    var fg = ctx.createLinearGradient(0, hz - 30, 0, hz + 40);
    fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(0.5, W.fog); fg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fg; ctx.fillRect(0, hz - 30, w, 70);
    return { canvas: cv, anim: anim, world: W };
  };

  // Tiền cảnh: cỏ, hoa ở mép dưới và tối viền
  Art.foreground = function (world, g) {
    var W = D.WORLDS[world], w = g.w, h = g.h;
    var cv = document.createElement("canvas"); cv.width = Math.ceil(w * g.dpr); cv.height = Math.ceil(h * g.dpr);
    var ctx = cv.getContext("2d"); ctx.scale(g.dpr, g.dpr);
    var R = D.rng(world * 31 + 3);
    var col = W.night ? "#1F4A3A" : (W.id === "autumn" ? "#9A8A2E" : "#4E8A2A");
    for (var i = 0; i < w / 5; i++) {
      var x = R() * w, bh = 8 + R() * 18, y = h + 2;
      ctx.strokeStyle = lit(col, (R() - 0.5) * 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (R() - 0.5) * 8, y - bh * 0.6, x + (R() - 0.5) * 14, y - bh); ctx.stroke();
    }
    for (i = 0; i < 14; i++) {
      var fx = R() * w, fy = h - 4 - R() * 10;
      ctx.fillStyle = W.night ? "#7DE3FF" : ["#FFF3A0", "#F7A8C8", "#FFFFFF", "#B9A0FF"][i % 4];
      for (var p = 0; p < 5; p++) { var a = p / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 2.5, fy + Math.sin(a) * 2.5, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    var vg = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, W.night ? "rgba(0,0,10,.5)" : "rgba(40,20,0,.25)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    return cv;
  };

  // Lớp động của nền: tia nắng, nấm phát sáng, pha lê, cờ
  Art.ambient = function (ctx, bg, g, t) {
    var A = bg.anim, W = bg.world;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    A.lights.forEach(function (L) {
      var a = 0.05 + 0.035 * Math.sin(t * 0.6 + L[2]);
      var gr = ctx.createLinearGradient(L[0], 0, L[0] - g.h * 0.5, g.h);
      gr.addColorStop(0, rgba(W.light, a)); gr.addColorStop(1, rgba(W.light, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(L[0], -10); ctx.lineTo(L[0] + L[1], -10); ctx.lineTo(L[0] + L[1] - g.h * 0.45, g.h); ctx.lineTo(L[0] - g.h * 0.45, g.h); ctx.fill();
    });
    A.mush.forEach(function (M) {
      var p = 0.6 + 0.4 * Math.sin(t * 1.5 + M[3]), r = M[2];
      var gr = ctx.createRadialGradient(M[0], M[1] - r, 1, M[0], M[1] - r, r * 3.5);
      gr.addColorStop(0, "rgba(120,240,255," + 0.5 * p + ")"); gr.addColorStop(1, "rgba(120,240,255,0)");
      ctx.fillStyle = gr; ctx.fillRect(M[0] - r * 4, M[1] - r * 5, r * 8, r * 8);
    });
    A.crystals.forEach(function (Cr) {
      var p = 0.6 + 0.4 * Math.sin(t * 1.2 + Cr[3]), r = Cr[2];
      var gr = ctx.createRadialGradient(Cr[0], Cr[1] - r, 1, Cr[0], Cr[1] - r, r * 3);
      gr.addColorStop(0, "rgba(200,150,255," + 0.45 * p + ")"); gr.addColorStop(1, "rgba(200,150,255,0)");
      ctx.fillStyle = gr; ctx.fillRect(Cr[0] - r * 3, Cr[1] - r * 4, r * 6, r * 6);
    });
    // sương tím nơi quái xuất hiện
    var P = A.portal, pg = ctx.createLinearGradient(P[0], 0, P[0] + P[2], 0);
    pg.addColorStop(0, "rgba(150,70,220,0)"); pg.addColorStop(1, "rgba(150,70,220," + (0.18 + 0.07 * Math.sin(t * 2)) + ")");
    ctx.fillStyle = pg; ctx.fillRect(P[0], P[1] - 20, P[2], P[3] + 20);
    ctx.restore();
    // thân nấm, pha lê (vẽ thường)
    A.mush.forEach(function (M) {
      var r = M[2];
      ctx.fillStyle = "#CFEFF0"; ctx.fillRect(M[0] - r * 0.15, M[1] - r, r * 0.3, r);
      ctx.fillStyle = "#5FE0F2"; ctx.beginPath(); ctx.ellipse(M[0], M[1] - r, r * 0.8, r * 0.45, 0, Math.PI, 0); ctx.fill();
    });
    A.crystals.forEach(function (Cr) {
      var r = Cr[2]; ctx.fillStyle = "#B48CFF";
      ctx.beginPath(); ctx.moveTo(Cr[0], Cr[1] - r * 2.2); ctx.lineTo(Cr[0] + r * 0.5, Cr[1]); ctx.lineTo(Cr[0] - r * 0.5, Cr[1]); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.moveTo(Cr[0], Cr[1] - r * 2.2); ctx.lineTo(Cr[0] - r * 0.2, Cr[1]); ctx.lineTo(Cr[0] - r * 0.5, Cr[1]); ctx.fill();
    });
    // cờ bay
    if (A.flag) {
      var fx = A.flag[0], fy = A.flag[1];
      ctx.fillStyle = "#E2533F"; ctx.beginPath(); ctx.moveTo(fx, fy);
      for (var i = 0; i <= 6; i++) ctx.lineTo(fx + i * 4, fy + Math.sin(t * 6 - i * 0.8) * 2.2 + i * 0.6);
      for (i = 6; i >= 0; i--) ctx.lineTo(fx + i * 4, fy + 14 + Math.sin(t * 6 - i * 0.8) * 2.2 - i * 0.6);
      ctx.fill();
    }
  };

  // ---------- Nhân vật khối gạch ----------
  var LOOK = {
    archer: { skin: "#F6CF57", torso: "#3E8E4A", legs: "#6B4A2E", arm: "#3E8E4A", hand: "#F6CF57", hat: "hood", hatC: "#2F7A3C", item: "bow", print: "belt" },
    sage: { skin: "#F6CF57", torso: "#C99A3A", legs: "#B08530", arm: "#C99A3A", hand: "#F6CF57", hat: "brim", hatC: "#7A5232", item: "lantern", robe: true, beard: "#F2F2F2", print: "rope" },
    knight: { skin: "#F6CF57", torso: "#AEB8C4", legs: "#59606B", arm: "#AEB8C4", hand: "#59606B", hat: "helm", hatC: "#C3CCD6", item: "shield", print: "tabard" },
    bomber: { skin: "#F6CF57", torso: "#8C5A35", legs: "#3D4E7A", arm: "#8C5A35", hand: "#F6CF57", hat: "miner", hatC: "#F2C230", item: "barrel", beard: "#E07A2E", short: true, print: "strap" },
    frost: { skin: "#F6CF57", torso: "#6FB8E8", legs: "#E8F4FF", arm: "#6FB8E8", hand: "#F6CF57", hat: "wizard", hatC: "#3E7CC8", item: "icestaff", robe: true, print: "flake" },
    twin: { skin: "#F6CF57", torso: "#8A5A3C", legs: "#3B3A40", arm: "#8A5A3C", hand: "#F6CF57", hat: "goggle", hatC: "#5A3A28", item: "xbow", print: "belt" },
    fire: { skin: "#F6CF57", torso: "#C83A2E", legs: "#5A2430", arm: "#C83A2E", hand: "#F6CF57", hat: "witch", hatC: "#6A1F2A", item: "firestaff", robe: true, print: "flame" },
    cannon: { skin: "#F6CF57", torso: "#3A6AC8", legs: "#2B2F3A", arm: "#3A6AC8", hand: "#F6CF57", hat: "cap", hatC: "#D8463A", item: "none" },
    imp: { skin: "#8A72B8", torso: "#3D3260", legs: "#2A2342", arm: "#3D3260", hand: "#8A72B8", hat: "horns", item: "claw", mon: true, print: "rag" },
    helm: { skin: "#8A72B8", torso: "#3D3260", legs: "#2A2342", arm: "#3D3260", hand: "#8A72B8", hat: "horns", item: "claw", mon: true, pot: true, print: "rag" },
    wolf: { skin: "#7A86A8", torso: "#4A4058", legs: "#2E2838", arm: "#4A4058", hand: "#7A86A8", hat: "wolf", hatC: "#6B6E7E", item: "claw", mon: true, print: "fur" },
    shield: { skin: "#8A72B8", torso: "#4B3A2E", legs: "#2A2342", arm: "#4B3A2E", hand: "#8A72B8", hat: "horns", item: "door", mon: true, print: "rag" },
    troll: { skin: "#7E9A62", torso: "#6A4A30", legs: "#4A3826", arm: "#7E9A62", hand: "#7E9A62", hat: "tusk", item: "club", mon: true, print: "belt" },
    boss: { skin: "#5D4A9A", torso: "#2A1F48", legs: "#1C1530", arm: "#2A1F48", hand: "#5D4A9A", hat: "crown", hatC: "#F2C230", item: "orbstaff", mon: true, cape: "#6A2A8A", print: "gem" }
  };
  Art.LOOK = LOOK;
  Art.OWNER = ["#3D7BE0", "#E8813A", "#5BC062", "#C25BE0"];

  function plastic(ctx, x0, x1, c) {
    var g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, lit(c, 0.28)); g.addColorStop(0.25, lit(c, 0.08)); g.addColorStop(0.7, c); g.addColorStop(1, lit(c, -0.3));
    return g;
  }

  // Vẽ một nhân vật tại chân (x, y), đơn vị u (px), hướng f (1 = nhìn phải)
  Art.fig = function (ctx, type, x, y, u, f, t, st) {
    var L = LOOK[type]; if (!L) return;
    st = st || {};
    if (type === "wisp") return Art.wisp(ctx, x, y, u, t, st);
    if (type === "cannon") return Art.cannon(ctx, x, y, u, t, st);
    var M = D.MONS[type], big = (M && M.big) || 1;
    u *= big;
    var tc = function (c) { if (!c) return c; if (st.hurt) c = mix(c, "#ffffff", 0.55); if (st.frozen) c = mix(c, "#8FDcff", 0.4); return c; };
    ctx.save();
    ctx.translate(x, y);
    // bóng
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 0, u * 1.15, u * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    if (st.plate) { // tấm đế màu người chơi
      ctx.fillStyle = lit(st.plate, -0.35); rr(ctx, -u * 1.05, -u * 0.12, u * 2.1, u * 0.3, u * 0.12); ctx.fill();
      ctx.fillStyle = st.plate; ctx.beginPath(); ctx.ellipse(0, -u * 0.12, u * 1.05, u * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      for (var sx = -1; sx <= 1; sx += 2) { ctx.fillStyle = lit(st.plate, 0.3); ctx.beginPath(); ctx.ellipse(sx * u * 0.48, -u * 0.2, u * 0.16, u * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.scale(f * u, u);
    var walk = st.walk ? Math.sin(t * (big > 1 ? 5 : 9) + (st.seed || 0)) : 0;
    var bob = st.walk ? Math.abs(walk) * 0.08 : Math.sin(t * 2.6 + (st.seed || 0)) * 0.035;
    if (st.jump) ctx.translate(0, -1.6 * Math.sin(Math.min(1, st.jump) * Math.PI));
    ctx.translate(0, -bob - (st.plate ? 0.15 : 0));
    ctx.lineJoin = "round";
    var line = "rgba(20,10,30,.35)";
    var legL = L.short ? 0.95 : 1.3, hipY = -legL - 0.2;
    var tY0 = hipY - 1.22, tY1 = hipY;

    // áo choàng sau lưng
    if (L.cape) { ctx.fillStyle = tc(L.cape); ctx.beginPath(); ctx.moveTo(-0.5, tY0 + 0.05); ctx.quadraticCurveTo(-1.5 - walk * 0.1, tY1, -1.1, -0.05); ctx.lineTo(0.2, -0.1); ctx.lineTo(0.4, tY0 + 0.1); ctx.fill(); }
    if (L.item === "bow" || L.item === "xbow") { // ống tên sau lưng
      ctx.save(); ctx.rotate(-0.35); ctx.fillStyle = tc("#7A4A26"); rr(ctx, -1.05, tY0 - 0.05, 0.38, 1.1, 0.1); ctx.fill();
      ctx.fillStyle = tc("#E8E2D0"); for (var q = 0; q < 3; q++) { ctx.fillRect(-1.0 + q * 0.1, tY0 - 0.35, 0.06, 0.3); } ctx.restore();
    }
    // tay sau
    var atk = st.atk ? 1 : 0, eat = st.eat ? Math.sin(t * 14) * 0.3 : 0;
    var armBack = 0.25 - walk * 0.45 + (L.mon && st.eat ? -1.2 + eat : 0);
    arm(ctx, -0.55, tY0 + 0.18, armBack, tc(L.arm), tc(L.hand), line);
    // chân
    ctx.fillStyle = tc(lit(L.legs, -0.1));
    if (L.robe) {
      ctx.fillStyle = plastic(ctx, -0.8, 0.8, tc(L.legs));
      ctx.beginPath(); ctx.moveTo(-0.72, hipY - 0.05); ctx.lineTo(0.72, hipY - 0.05); ctx.lineTo(0.9 + walk * 0.05, 0); ctx.lineTo(-0.9 + walk * 0.05, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 0.05; ctx.stroke();
      ctx.fillStyle = tc(lit(L.legs, -0.25)); ctx.fillRect(-0.9, -0.12, 1.8, 0.12);
    } else {
      leg(ctx, -0.36, hipY, legL, walk * 0.5, tc(lit(L.legs, -0.12)), line);
      leg(ctx, 0.36, hipY, legL, -walk * 0.5, tc(L.legs), line);
      ctx.fillStyle = plastic(ctx, -0.8, 0.8, tc(L.legs)); rr(ctx, -0.8, hipY - 0.12, 1.6, 0.3, 0.06); ctx.fill();
    }
    // thân
    ctx.fillStyle = plastic(ctx, -0.8, 0.8, tc(L.torso));
    ctx.beginPath(); ctx.moveTo(-0.6, tY0); ctx.lineTo(0.6, tY0); ctx.lineTo(0.8, tY1); ctx.lineTo(-0.8, tY1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = 0.05; ctx.stroke();
    print(ctx, L.print, tY0, tY1, tc, L);
    // đầu
    var hy = tY0 - 0.08;
    ctx.fillStyle = tc(lit(L.skin, -0.2)); ctx.fillRect(-0.24, hy - 0.06, 0.48, 0.16);
    var hTop = hy - 1.02;
    ctx.fillStyle = plastic(ctx, -0.56, 0.56, tc(L.skin));
    rr(ctx, -0.56, hTop, 1.12, 0.98, 0.28); ctx.fill(); ctx.strokeStyle = line; ctx.stroke();
    if (!L.hat || L.hat === "horns" || L.hat === "tusk") { // núm trên đầu
      ctx.fillStyle = plastic(ctx, -0.3, 0.3, tc(L.skin)); ctx.fillRect(-0.3, hTop - 0.18, 0.6, 0.2);
      ctx.fillStyle = tc(lit(L.skin, 0.2)); ctx.beginPath(); ctx.ellipse(0, hTop - 0.18, 0.3, 0.08, 0, 0, Math.PI * 2); ctx.fill();
    }
    face(ctx, L, hTop, t, st, tc);
    hat(ctx, L, hTop, t, tc, st);
    // tay trước và vật cầm
    var armFront = 0.35 + walk * 0.45 - atk * 0.9 + (L.mon && st.eat ? -1.3 - eat : 0);
    if (L.item === "shield" || L.item === "door") armFront = 0.9;
    if (L.item === "barrel") armFront = 0.6;
    var hp = arm(ctx, 0.55, tY0 + 0.18, armFront, tc(L.arm), tc(L.hand), line);
    item(ctx, L.item, hp, armFront, t, st, tc, tY0, tY1);
    ctx.restore();
  };

  function leg(ctx, x, hipY, len, ang, col, line) {
    ctx.save(); ctx.translate(x, hipY); ctx.rotate(ang);
    ctx.fillStyle = col; rr(ctx, -0.36, 0, 0.72, len, 0.08); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.fillStyle = lit(col, -0.2); ctx.fillRect(-0.36, len - 0.18, 0.86, 0.18);
    ctx.restore();
  }
  function arm(ctx, x, y, ang, col, hand, line) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = plastic(ctx, -0.2, 0.2, col); rr(ctx, -0.21, -0.12, 0.42, 1.0, 0.2); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.strokeStyle = hand; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.arc(0, 1.08, 0.17, -0.6 * Math.PI + Math.PI / 2, 1.4 * Math.PI + Math.PI / 2 - 0.6); ctx.stroke();
    ctx.restore();
    return [x - Math.sin(ang) * 1.08, y + Math.cos(ang) * 1.08];
  }
  function face(ctx, L, hTop, t, st, tc) {
    var ox = 0.12, ey = hTop + 0.42;
    var blink = (Math.sin(t * 1.3 + (st.seed || 0) * 7) > 0.985);
    if (L.mon) {
      ctx.fillStyle = st.frozen ? "#BFF2FF" : "#FFE45C";
      ctx.save(); ctx.shadowColor = "#FFD23A"; ctx.shadowBlur = 0.3 * 10;
      ctx.beginPath(); ctx.ellipse(ox - 0.2, ey, 0.11, 0.08, 0.3, 0, Math.PI * 2); ctx.ellipse(ox + 0.24, ey, 0.11, 0.08, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "#1A1028"; ctx.lineWidth = 0.08;
      ctx.beginPath(); ctx.moveTo(ox - 0.36, ey - 0.2); ctx.lineTo(ox - 0.08, ey - 0.08); ctx.moveTo(ox + 0.4, ey - 0.2); ctx.lineTo(ox + 0.12, ey - 0.08); ctx.stroke();
      ctx.fillStyle = "#1A1028"; rr(ctx, ox - 0.26, ey + 0.2, 0.56, 0.2 + (st.eat ? Math.abs(Math.sin(t * 14)) * 0.12 : 0), 0.06); ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(ox - 0.24 + i * 0.14, ey + 0.2); ctx.lineTo(ox - 0.17 + i * 0.14, ey + 0.31); ctx.lineTo(ox - 0.1 + i * 0.14, ey + 0.2); ctx.fill(); }
      return;
    }
    ctx.fillStyle = "#1E1A18";
    if (blink) { ctx.fillRect(ox - 0.28, ey, 0.16, 0.04); ctx.fillRect(ox + 0.12, ey, 0.16, 0.04); }
    else { ctx.beginPath(); ctx.arc(ox - 0.2, ey, 0.085, 0, Math.PI * 2); ctx.arc(ox + 0.2, ey, 0.085, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ox - 0.17, ey - 0.03, 0.03, 0, Math.PI * 2); ctx.arc(ox + 0.23, ey - 0.03, 0.03, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = "#1E1A18"; ctx.lineWidth = 0.06;
    ctx.beginPath(); ctx.moveTo(ox - 0.3, ey - 0.17); ctx.lineTo(ox - 0.1, ey - 0.19); ctx.moveTo(ox + 0.1, ey - 0.19); ctx.lineTo(ox + 0.3, ey - 0.17); ctx.stroke();
    ctx.beginPath(); ctx.arc(ox, ey + 0.13, 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = "rgba(255,120,90,.35)"; ctx.beginPath(); ctx.arc(ox - 0.32, ey + 0.2, 0.08, 0, Math.PI * 2); ctx.arc(ox + 0.34, ey + 0.2, 0.08, 0, Math.PI * 2); ctx.fill();
    if (L.beard) { ctx.fillStyle = tc(L.beard); ctx.beginPath(); ctx.moveTo(-0.5, ey + 0.18); ctx.quadraticCurveTo(ox, ey + 1.05, 0.55, ey + 0.18); ctx.quadraticCurveTo(ox, ey + 0.42, -0.5, ey + 0.18); ctx.fill(); }
  }
  function hat(ctx, L, hTop, t, tc, st) {
    var c = tc(L.hatC || "#888"), i;
    switch (L.hat) {
      case "hood":
        ctx.fillStyle = plastic(ctx, -0.7, 0.7, c);
        ctx.beginPath(); ctx.moveTo(-0.66, hTop + 0.75); ctx.lineTo(-0.7, hTop + 0.05); ctx.quadraticCurveTo(-0.2, hTop - 0.55, 0.55, hTop - 0.05); ctx.lineTo(0.62, hTop + 0.18); ctx.lineTo(-0.35, hTop + 0.2); ctx.lineTo(-0.45, hTop + 0.75); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.6, hTop - 0.05); ctx.quadraticCurveTo(-1.2, hTop - 0.1, -1.25, hTop + 0.35); ctx.quadraticCurveTo(-0.9, hTop + 0.05, -0.55, hTop + 0.2); ctx.fill();
        ctx.strokeStyle = tc("#E8463A"); ctx.lineWidth = 0.1; ctx.beginPath(); ctx.moveTo(0.05, hTop - 0.25); ctx.quadraticCurveTo(-0.3, hTop - 0.9, -0.75, hTop - 0.75); ctx.stroke();
        break;
      case "brim":
        ctx.fillStyle = plastic(ctx, -1, 1, c); ctx.beginPath(); ctx.ellipse(0, hTop + 0.08, 1.0, 0.2, 0, 0, Math.PI * 2); ctx.fill();
        rr(ctx, -0.5, hTop - 0.55, 1.0, 0.65, 0.18); ctx.fill();
        ctx.fillStyle = tc("#3A6A3A"); ctx.fillRect(-0.5, hTop - 0.08, 1.0, 0.12);
        break;
      case "helm":
        ctx.fillStyle = plastic(ctx, -0.65, 0.65, c); rr(ctx, -0.64, hTop - 0.12, 1.28, 0.9, 0.3); ctx.fill();
        ctx.fillStyle = "#2A2E36"; rr(ctx, -0.1, hTop + 0.32, 0.72, 0.12, 0.05); ctx.fill();
        ctx.strokeStyle = tc(lit(L.hatC, -0.3)); ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, hTop - 0.1); ctx.lineTo(0, hTop + 0.75); ctx.stroke();
        ctx.fillStyle = tc("#D8463A"); ctx.beginPath(); ctx.moveTo(-0.1, hTop - 0.1); ctx.quadraticCurveTo(-0.3, hTop - 0.9 + Math.sin(t * 4) * 0.05, -1.0, hTop - 0.55); ctx.quadraticCurveTo(-0.6, hTop - 0.3, -0.35, hTop - 0.05); ctx.fill();
        break;
      case "miner":
        ctx.fillStyle = plastic(ctx, -0.65, 0.65, c); ctx.beginPath(); ctx.ellipse(0, hTop + 0.12, 0.66, 0.6, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(-0.72, hTop + 0.06, 1.44, 0.14);
        ctx.fillStyle = "#FFF7C0"; ctx.beginPath(); ctx.arc(0.42, hTop - 0.12, 0.13, 0, Math.PI * 2); ctx.fill();
        break;
      case "wizard": case "witch":
        ctx.fillStyle = plastic(ctx, -0.9, 0.9, c);
        ctx.beginPath(); ctx.ellipse(0, hTop + 0.05, 0.92, 0.18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.55, hTop); ctx.quadraticCurveTo(-0.3, hTop - 1.1, L.hat === "witch" ? -0.85 : -0.2, hTop - 1.55 + Math.sin(t * 2) * 0.05); ctx.quadraticCurveTo(0.05, hTop - 0.7, 0.55, hTop); ctx.fill();
        ctx.fillStyle = tc(L.hat === "witch" ? "#F2A93B" : "#FFFFFF");
        star(ctx, 0.05, hTop - 0.45, 0.16);
        break;
      case "goggle":
        ctx.fillStyle = plastic(ctx, -0.6, 0.6, c); ctx.beginPath(); ctx.ellipse(0, hTop + 0.1, 0.6, 0.45, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(0, hTop + 0.02, 0.85, 0.12);
        ctx.fillStyle = "#2A2A2A"; ctx.fillRect(-0.58, hTop + 0.12, 1.16, 0.1);
        ctx.fillStyle = "#8FD8FF"; ctx.beginPath(); ctx.arc(-0.1, hTop + 0.12, 0.13, 0, Math.PI * 2); ctx.arc(0.25, hTop + 0.12, 0.13, 0, Math.PI * 2); ctx.fill();
        break;
      case "cap":
        ctx.fillStyle = plastic(ctx, -0.6, 0.6, c); ctx.beginPath(); ctx.ellipse(0, hTop + 0.12, 0.6, 0.45, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(0, hTop + 0.04, 0.9, 0.12);
        break;
      case "horns": case "tusk":
        ctx.fillStyle = tc("#EDE2C8");
        if (L.hat === "horns") {
          ctx.beginPath(); ctx.moveTo(-0.5, hTop + 0.1); ctx.quadraticCurveTo(-0.9, hTop - 0.3, -0.6, hTop - 0.6); ctx.quadraticCurveTo(-0.55, hTop - 0.2, -0.25, hTop + 0.05); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0.5, hTop + 0.1); ctx.quadraticCurveTo(0.9, hTop - 0.3, 0.75, hTop - 0.6); ctx.quadraticCurveTo(0.55, hTop - 0.2, 0.25, hTop + 0.05); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(-0.05, hTop + 0.78); ctx.lineTo(0.0, hTop + 0.5); ctx.lineTo(0.1, hTop + 0.78); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0.32, hTop + 0.78); ctx.lineTo(0.38, hTop + 0.5); ctx.lineTo(0.46, hTop + 0.78); ctx.fill();
        }
        if (L.pot && !st.noArmor) { // nồi sắt
          ctx.fillStyle = plastic(ctx, -0.65, 0.65, tc("#6E7480")); rr(ctx, -0.66, hTop - 0.4, 1.32, 0.7, 0.12); ctx.fill();
          ctx.fillStyle = tc("#4A4F58"); ctx.fillRect(-0.8, hTop + 0.18, 1.6, 0.14);
          ctx.strokeStyle = tc("#4A4F58"); ctx.lineWidth = 0.1; ctx.beginPath(); ctx.arc(-0.85, hTop - 0.05, 0.18, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
          if (st.armorPct < 50) { ctx.strokeStyle = "#2A2E36"; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0.1, hTop - 0.4); ctx.lineTo(0, hTop - 0.1); ctx.lineTo(0.2, hTop + 0.1); ctx.stroke(); }
        }
        break;
      case "wolf":
        ctx.fillStyle = plastic(ctx, -0.7, 0.7, c);
        ctx.beginPath(); ctx.ellipse(0, hTop + 0.1, 0.7, 0.55, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.5, hTop - 0.15); ctx.lineTo(-0.35, hTop - 0.75); ctx.lineTo(-0.1, hTop - 0.3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0.1, hTop - 0.3); ctx.lineTo(0.35, hTop - 0.75); ctx.lineTo(0.5, hTop - 0.15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0.3, hTop - 0.1); ctx.lineTo(1.05, hTop + 0.1); ctx.lineTo(0.5, hTop + 0.25); ctx.fill();
        ctx.fillStyle = "#1A1A1A"; ctx.beginPath(); ctx.arc(1.0, hTop + 0.1, 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = plastic(ctx, -0.9, 0.2, c); ctx.beginPath(); ctx.moveTo(-0.65, hTop + 0.1); ctx.quadraticCurveTo(-1.1, hTop + 0.9, -0.8, hTop + 1.6); ctx.lineTo(-0.5, hTop + 0.6); ctx.fill();
        break;
      case "crown":
        ctx.fillStyle = plastic(ctx, -0.6, 0.6, c);
        ctx.beginPath(); ctx.moveTo(-0.58, hTop + 0.1); ctx.lineTo(-0.62, hTop - 0.5); ctx.lineTo(-0.3, hTop - 0.2); ctx.lineTo(0, hTop - 0.65); ctx.lineTo(0.3, hTop - 0.2); ctx.lineTo(0.62, hTop - 0.5); ctx.lineTo(0.58, hTop + 0.1); ctx.fill();
        ctx.fillStyle = "#E83A6A"; ctx.beginPath(); ctx.arc(0, hTop - 0.1, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = tc("#EDE2C8");
        ctx.beginPath(); ctx.moveTo(-0.55, hTop + 0.2); ctx.quadraticCurveTo(-1.1, hTop - 0.4, -0.9, hTop - 0.9); ctx.quadraticCurveTo(-0.7, hTop - 0.3, -0.4, hTop); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0.55, hTop + 0.2); ctx.quadraticCurveTo(1.1, hTop - 0.4, 0.95, hTop - 0.9); ctx.quadraticCurveTo(0.7, hTop - 0.3, 0.4, hTop); ctx.fill();
        break;
    }
  }
  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    ctx.closePath(); ctx.fill();
  }
  Art.star = star;
  function print(ctx, p, y0, y1, tc, L) {
    var mid = (y0 + y1) / 2;
    switch (p) {
      case "belt": ctx.fillStyle = tc("#4A2E1A"); ctx.fillRect(-0.78, y1 - 0.28, 1.56, 0.16); ctx.fillStyle = tc("#E8C04A"); ctx.fillRect(-0.1, y1 - 0.3, 0.2, 0.2);
        ctx.strokeStyle = tc("#4A2E1A"); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(-0.5, y0); ctx.lineTo(0.55, y1 - 0.3); ctx.stroke(); break;
      case "rope": ctx.fillStyle = tc("#F2E3B0"); ctx.fillRect(-0.76, y1 - 0.3, 1.52, 0.1); ctx.fillRect(0.2, y1 - 0.3, 0.08, 0.5); break;
      case "tabard": ctx.fillStyle = tc("#2F5FB8"); ctx.beginPath(); ctx.moveTo(-0.35, y0); ctx.lineTo(0.35, y0); ctx.lineTo(0.45, y1); ctx.lineTo(-0.45, y1); ctx.fill();
        ctx.fillStyle = tc("#F2C230"); star(ctx, 0, mid, 0.22); break;
      case "strap": ctx.fillStyle = tc("#3A2A1A"); ctx.fillRect(-0.4, y0, 0.16, y1 - y0); ctx.fillRect(0.24, y0, 0.16, y1 - y0); break;
      case "flake": ctx.strokeStyle = tc("#FFFFFF"); ctx.lineWidth = 0.07; for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.25, mid + Math.sin(a) * 0.25); ctx.lineTo(-Math.cos(a) * 0.25, mid - Math.sin(a) * 0.25); ctx.stroke(); } break;
      case "flame": ctx.fillStyle = tc("#F2A93B"); ctx.beginPath(); ctx.moveTo(0, mid - 0.32); ctx.quadraticCurveTo(0.3, mid, 0.12, mid + 0.25); ctx.quadraticCurveTo(0, mid + 0.1, -0.15, mid + 0.25); ctx.quadraticCurveTo(-0.3, mid, 0, mid - 0.32); ctx.fill(); break;
      case "rag": ctx.fillStyle = tc(lit(L.torso, -0.3)); ctx.beginPath(); ctx.moveTo(-0.8, y1); for (var k = 0; k < 6; k++) ctx.lineTo(-0.8 + k * 0.32 + 0.16, y1 + (k % 2 ? 0.2 : 0.05)); ctx.lineTo(0.8, y1); ctx.lineTo(0.75, y1 - 0.15); ctx.lineTo(-0.75, y1 - 0.15); ctx.fill();
        ctx.strokeStyle = tc(lit(L.torso, 0.25)); ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(-0.3, y0 + 0.2); ctx.lineTo(-0.1, mid); ctx.moveTo(0.3, y0 + 0.3); ctx.lineTo(0.15, mid + 0.1); ctx.stroke(); break;
      case "fur": ctx.fillStyle = tc("#8E8E9E"); ctx.beginPath(); ctx.moveTo(-0.6, y0); for (var j = 0; j < 7; j++) ctx.lineTo(-0.6 + j * 0.2, y0 + (j % 2 ? 0.35 : 0.15)); ctx.lineTo(0.6, y0); ctx.fill(); break;
      case "gem": ctx.fillStyle = tc("#F2C230"); ctx.fillRect(-0.78, y1 - 0.3, 1.56, 0.14); ctx.fillStyle = "#9BF0FF"; ctx.beginPath(); ctx.moveTo(0, mid - 0.25); ctx.lineTo(0.18, mid); ctx.lineTo(0, mid + 0.25); ctx.lineTo(-0.18, mid); ctx.fill(); break;
    }
  }
  function item(ctx, it, hp, ang, t, st, tc, y0, y1) {
    var x = hp[0], y = hp[1];
    ctx.save(); ctx.translate(x, y);
    switch (it) {
      case "bow":
        ctx.strokeStyle = tc("#8A5A2E"); ctx.lineWidth = 0.13; ctx.beginPath(); ctx.arc(-0.25, 0, 0.85, -1.15, 1.15); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.25 + Math.cos(-1.15) * 0.85, Math.sin(-1.15) * 0.85); ctx.lineTo(st.atk ? -0.5 : -0.1, 0); ctx.lineTo(-0.25 + Math.cos(1.15) * 0.85, Math.sin(1.15) * 0.85); ctx.stroke();
        break;
      case "xbow":
        ctx.fillStyle = tc("#6A4026"); ctx.fillRect(-0.2, -0.1, 1.2, 0.18);
        ctx.strokeStyle = tc("#3A3A3A"); ctx.lineWidth = 0.1; ctx.beginPath(); ctx.moveTo(0.75, -0.55); ctx.quadraticCurveTo(0.95, 0, 0.75, 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0.45, -0.45); ctx.quadraticCurveTo(0.65, 0, 0.45, 0.45); ctx.stroke();
        break;
      case "lantern":
        ctx.strokeStyle = tc("#6A4A2A"); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(0, 0.6); ctx.lineTo(0.1, -1.9); ctx.stroke();
        ctx.strokeStyle = tc("#3A3A3A"); ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0.1, -1.9); ctx.lineTo(0.5, -1.9); ctx.lineTo(0.5, -1.6); ctx.stroke();
        var gl = 0.7 + 0.3 * Math.sin(t * 3) + (st.atk ? 0.6 : 0);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var g = ctx.createRadialGradient(0.5, -1.35, 0.05, 0.5, -1.35, 1.2 * gl); g.addColorStop(0, "rgba(255,210,110,.75)"); g.addColorStop(1, "rgba(255,210,110,0)");
        ctx.fillStyle = g; ctx.fillRect(-1, -2.8, 3, 3); ctx.restore();
        ctx.fillStyle = "#FFD86A"; rr(ctx, 0.32, -1.6, 0.36, 0.45, 0.08); ctx.fill(); ctx.strokeStyle = "#3A3A3A"; ctx.stroke();
        break;
      case "shield":
        ctx.fillStyle = plastic(ctx, 0, 1, tc("#2F5FB8"));
        ctx.beginPath(); ctx.moveTo(0.05, -1.0); ctx.lineTo(0.95, -1.0); ctx.lineTo(0.95, 0.1); ctx.quadraticCurveTo(0.9, 0.8, 0.5, 1.0); ctx.quadraticCurveTo(0.1, 0.8, 0.05, 0.1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = tc("#C9D2DC"); ctx.lineWidth = 0.1; ctx.stroke();
        ctx.fillStyle = tc("#F2C230"); star(ctx, 0.5, -0.1, 0.3);
        if (st.hpPct < 50) { ctx.strokeStyle = "#1A1A2A"; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0.3, -0.9); ctx.lineTo(0.5, -0.4); ctx.lineTo(0.35, 0.1); ctx.stroke(); }
        break;
      case "barrel":
        var fl = st.fuse > 0 && Math.sin(t * 30) > 0;
        ctx.fillStyle = plastic(ctx, 0, 1.2, tc(fl ? "#FF6A4A" : "#C83A2E")); rr(ctx, 0.0, -0.75, 1.1, 1.25, 0.25); ctx.fill();
        ctx.fillStyle = tc("#5A3A20"); ctx.fillRect(0, -0.5, 1.1, 0.12); ctx.fillRect(0, 0.2, 1.1, 0.12);
        ctx.fillStyle = "#FFF2C0"; ctx.fillRect(0.15, -0.22, 0.8, 0.28); ctx.fillStyle = "#C83A2E"; star(ctx, 0.55, -0.08, 0.12);
        ctx.strokeStyle = "#3A3A3A"; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0.6, -0.75); ctx.quadraticCurveTo(0.8, -1.1, 0.6, -1.25); ctx.stroke();
        if (st.fuse > 0) { ctx.fillStyle = Math.sin(t * 40) > 0 ? "#FFE45C" : "#FF7A2E"; star(ctx, 0.6, -1.3, 0.22); }
        break;
      case "icestaff": case "firestaff": case "orbstaff":
        ctx.strokeStyle = tc(it === "orbstaff" ? "#2A1F38" : "#7A5A3A"); ctx.lineWidth = 0.13; ctx.beginPath(); ctx.moveTo(0, 0.7); ctx.lineTo(0.1, -1.7); ctx.stroke();
        var oc = it === "icestaff" ? "#8FE8FF" : it === "firestaff" ? "#FF8A3A" : "#C77DFF";
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var g2 = ctx.createRadialGradient(0.1, -1.9, 0.05, 0.1, -1.9, 0.9 + (st.atk ? 0.6 : 0)); g2.addColorStop(0, rgba(oc, 0.9)); g2.addColorStop(1, rgba(oc, 0));
        ctx.fillStyle = g2; ctx.fillRect(-1.2, -3.2, 2.6, 2.6); ctx.restore();
        ctx.fillStyle = oc;
        if (it === "icestaff") { ctx.beginPath(); ctx.moveTo(0.1, -2.35); ctx.lineTo(0.3, -1.9); ctx.lineTo(0.1, -1.55); ctx.lineTo(-0.1, -1.9); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(0.1, -1.9, 0.25, 0, Math.PI * 2); ctx.fill(); }
        break;
      case "door":
        var cr = st.armorPct;
        if (cr > 0) {
          ctx.fillStyle = plastic(ctx, 0, 1.3, tc("#8A5A34")); rr(ctx, 0.1, -1.9, 0.75, 2.4, 0.08); ctx.fill();
          ctx.strokeStyle = tc("#5A3A20"); ctx.lineWidth = 0.05; for (var i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0.1 + i * 0.25, -1.9); ctx.lineTo(0.1 + i * 0.25, 0.5); ctx.stroke(); }
          ctx.fillStyle = tc("#3A3A40"); ctx.fillRect(0.1, -1.5, 0.75, 0.12); ctx.fillRect(0.1, 0.05, 0.75, 0.12);
          if (cr < 60) { ctx.strokeStyle = "#1A1008"; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0.3, -1.9); ctx.lineTo(0.5, -1.2); ctx.lineTo(0.35, -0.6); ctx.stroke(); }
          if (cr < 30) { ctx.beginPath(); ctx.moveTo(0.8, -0.4); ctx.lineTo(0.55, 0.0); ctx.lineTo(0.7, 0.5); ctx.stroke(); }
        }
        break;
      case "club":
        ctx.rotate(-0.4 - (st.eat ? Math.sin(t * 10) * 0.6 : 0));
        ctx.fillStyle = tc("#6A4A2A"); ctx.beginPath(); ctx.moveTo(-0.08, 0.3); ctx.lineTo(0.08, 0.3); ctx.lineTo(0.3, -1.6); ctx.quadraticCurveTo(0, -1.9, -0.3, -1.6); ctx.fill();
        ctx.fillStyle = tc("#4A3420"); ctx.beginPath(); ctx.arc(0.15, -1.2, 0.07, 0, Math.PI * 2); ctx.arc(-0.12, -1.45, 0.07, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  Art.wisp = function (ctx, x, y, u, t, st) {
    var fy = y - u * 2.2 + Math.sin(t * 3 + (st.seed || 0)) * u * 0.25;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(x, y, u * 0.8, u * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    var g = ctx.createRadialGradient(x, fy, 1, x, fy, u * 2.4);
    g.addColorStop(0, st.frozen ? "rgba(180,240,255,.55)" : "rgba(140,255,220,.55)"); g.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = g; ctx.fillRect(x - u * 2.5, fy - u * 2.5, u * 5, u * 5);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = st.hurt ? "#FFFFFF" : "rgba(170,255,230,.85)";
    ctx.beginPath(); ctx.arc(x, fy, u * 0.85, Math.PI, 0);
    for (var i = 0; i <= 6; i++) { var tx = x + u * 0.85 - i * (u * 1.7 / 6); ctx.lineTo(tx + u * 0.5, fy + u * 0.6 + Math.sin(t * 8 + i) * u * 0.15 + (i % 2 ? u * 0.3 : 0)); }
    ctx.lineTo(x + u * 1.6, fy + u * 0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1A3A40"; ctx.beginPath(); ctx.ellipse(x - u * 0.3, fy - u * 0.1, u * 0.14, u * 0.2, 0, 0, Math.PI * 2); ctx.ellipse(x + u * 0.15, fy - u * 0.1, u * 0.14, u * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - u * 0.08, fy + u * 0.3, u * 0.12, u * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  Art.cannon = function (ctx, x, y, u, t, st) {
    // người kéo pháo nhỏ phía sau
    Art.fig(ctx, "cannonman", x - u * 0.95, y - u * 0.1, u * 0.8, 1, t, { seed: st.seed, hurt: st.hurt });
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 0, u * 1.3, u * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    if (st.plate) { ctx.fillStyle = lit(st.plate, -0.35); rr(ctx, -u * 1.2, -u * 0.12, u * 2.4, u * 0.3, u * 0.12); ctx.fill(); ctx.fillStyle = st.plate; ctx.beginPath(); ctx.ellipse(0, -u * 0.12, u * 1.2, u * 0.26, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.scale(u, u);
    var rec = st.atk ? -0.25 : 0, hurt = st.hurt;
    // thân pháo bằng gạch
    var bc = hurt ? "#FF9A8A" : "#C8402E";
    for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) {
      ctx.fillStyle = plastic(ctx, -0.9 + c * 0.9, c * 0.9, lit(bc, r ? -0.1 : 0.05)); rr(ctx, -0.95 + c * 0.92 + rec, -1.45 + r * 0.55, 0.9, 0.55, 0.06); ctx.fill();
    }
    stud(ctx, -0.55 + rec, -1.45, 0.16, bc); stud(ctx, 0.35 + rec, -1.45, 0.16, bc);
    ctx.save(); ctx.translate(0.3 + rec, -1.3); ctx.rotate(-0.25);
    ctx.fillStyle = plastic(ctx, 0, 1.4, "#3A3E48"); rr(ctx, 0, -0.3, 1.45, 0.6, 0.15); ctx.fill();
    ctx.fillStyle = "#16181E"; ctx.beginPath(); ctx.ellipse(1.45, 0, 0.12, 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#4A3424"; [-0.55, 0.45].forEach(function (wx) { ctx.beginPath(); ctx.arc(wx + rec, -0.35, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#8A6A44"; ctx.beginPath(); ctx.arc(wx + rec, -0.35, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#4A3424"; });
    ctx.restore();
  };
  LOOK.cannonman = { skin: "#F6CF57", torso: "#3A6AC8", legs: "#2B2F3A", arm: "#3A6AC8", hand: "#F6CF57", hat: "cap", hatC: "#D8463A", item: "none", short: true };

  // Ảnh chân dung cho thẻ bài
  Art.portrait = function (type, size, opts) {
    var cv = document.createElement("canvas"), dpr = 2; cv.width = size * dpr; cv.height = size * dpr;
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    var M = D.MONS[type], big = (M && M.big) || 1;
    var u = size / 5.2 / big * (type === "cannon" ? 0.85 : 1);
    if (type === "wisp") Art.wisp(ctx, size / 2, size * 0.98, size / 4.2, 0.5, {});
    else if (type === "cannon") { ctx.save(); ctx.translate(-size * 0.12, 0); Art.fig(ctx, "cannon", size / 2 + size * 0.1, size * 0.93, u, 1, 0.5, {}); ctx.restore(); }
    else Art.fig(ctx, type, size / 2, size * 0.94, u, M ? -1 : 1, 0.5, (opts || {}));
    return cv.toDataURL();
  };

  window.Art = Art;
})();
