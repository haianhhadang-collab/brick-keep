// Brick Keep: dữ liệu nhân vật, quái, thế giới, màn chơi.
// Mọi tên và hình nhân vật đều tự đặt, tự vẽ (không chép game gốc).
(function () {
  "use strict";
  var D = {};
  D.COLS = 9; D.LANES = 5;

  // ---------- Quân phòng thủ (phe Hiệp sĩ) ----------
  // cost: gạch cần có; cd: giây hồi thẻ; hp: máu; rate: giây/lần bắn; dmg: sát thương
  D.HEROES = {
    archer: { name: "Archer", vi: "Cung thủ", cost: 100, cd: 6, hp: 300, rate: 1.4, dmg: 20, proj: "arrow",
      desc: "Bắn tên dọc làn." },
    sage: { name: "Lantern Sage", vi: "Hiền giả đèn lồng", cost: 50, cd: 8, hp: 300, rate: 16,
      desc: "Cứ 16 giây: +25 gạch và soi sáng chữ đầu của một từ còn ẩn." },
    knight: { name: "Shield Knight", vi: "Hiệp sĩ khiên", cost: 50, cd: 20, hp: 2400,
      desc: "Tường người: chặn quái rất lâu." },
    bomber: { name: "Barrel Dwarf", vi: "Thợ mìn lùn", cost: 150, cd: 30, hp: 9999, fuse: 1.1, dmg: 1800,
      desc: "Nổ tung ô 3×3 ngay sau khi đặt." },
    frost: { name: "Frost Mage", vi: "Pháp sư băng", cost: 175, cd: 7, hp: 300, rate: 1.5, dmg: 18, proj: "frost",
      desc: "Cầu băng làm quái chậm một nửa." },
    twin: { name: "Twin Crossbow", vi: "Nỏ đôi", cost: 200, cd: 7, hp: 300, rate: 1.4, dmg: 20, proj: "arrow", shots: 2,
      desc: "Mỗi lần bắn hai mũi tên." },
    fire: { name: "Ember Witch", vi: "Phù thủy lửa", cost: 225, cd: 8, hp: 300, rate: 1.8, dmg: 40, proj: "fire", splash: 0.9,
      desc: "Cầu lửa nổ lan, đốt cả nhóm quái." },
    cannon: { name: "Brick Cannon", vi: "Pháo gạch", cost: 300, cd: 12, hp: 500, rate: 3.2, dmg: 110, proj: "brick", splash: 0.7,
      desc: "Ném viên gạch nặng qua đầu quái, nổ lan." }
  };
  D.HERO_ORDER = ["archer", "sage", "knight", "bomber", "frost", "twin", "fire", "cannon"];
  // màn mở khóa (qua màn n thì được quân này)
  D.HERO_UNLOCK = { archer: 0, sage: 1, knight: 2, bomber: 3, frost: 4, twin: 6, fire: 8, cannon: 11 };

  // ---------- Quái (phe Bóng đêm) ----------
  // spd: ô/giây; dps: sát thương mỗi giây khi cắn quân; armor: giáp phụ
  D.MONS = {
    imp: { name: "Gloom Imp", vi: "Quỷ con", hp: 190, spd: 0.24, dps: 60, cost: 50, cd: 4, w: 1, from: 1,
      desc: "Quái thường, đi chậm." },
    helm: { name: "Pot-helm Imp", vi: "Quỷ đội nồi sắt", hp: 190, armor: 360, spd: 0.24, dps: 60, cost: 100, cd: 8, w: 2, from: 2,
      desc: "Đội nồi sắt, phải bắn rơi nồi trước." },
    wolf: { name: "Hound Rider", vi: "Kỵ sĩ chó sói", hp: 300, spd: 0.48, dps: 70, cost: 100, cd: 10, w: 2, from: 4, jumper: true,
      desc: "Chạy nhanh, nhảy qua quân đầu tiên." },
    shield: { name: "Door Bearer", vi: "Quỷ vác cửa", hp: 190, armor: 1000, spd: 0.2, dps: 60, cost: 150, cd: 14, w: 4, from: 6,
      desc: "Vác cánh cửa gỗ, rất lì." },
    wisp: { name: "Gloom Wisp", vi: "Ma trơi", hp: 160, spd: 0.34, dps: 0, cost: 100, cd: 12, w: 2, from: 8, ghost: true,
      desc: "Bay xuyên qua quân, lao thẳng vào lâu đài." },
    troll: { name: "Stone Troll", vi: "Quỷ khổng lồ", hp: 1300, spd: 0.16, dps: 320, cost: 250, cd: 25, w: 8, from: 10, big: 1.5,
      desc: "To khỏe, đập vỡ quân chỉ trong vài nhát." },
    boss: { name: "Gloom King", vi: "Vua Bóng Đêm", hp: 4200, spd: 0.09, dps: 900, cost: 9999, cd: 999, w: 0, from: 99, big: 2.1,
      desc: "Trùm cuối thế giới: gọi thêm quỷ con." }
  };
  D.MON_ORDER = ["imp", "helm", "wolf", "shield", "wisp", "troll", "boss"];
  D.SHADOW_CARDS = ["imp", "helm", "wolf", "shield", "wisp", "troll"]; // dùng ở chế độ đối kháng

  // ---------- Thế giới ----------
  D.WORLDS = [
    { id: "meadow", name: "Sunlit Meadow", vi: "Đồng cỏ nắng", night: false,
      sky: ["#3E8EE0", "#78B8F0", "#CDE7F7"], hill: ["#5C9A6A", "#3F7A5A"], grassA: "#7BB23F", grassB: "#6CA236", path: "#9C8A62", fog: "rgba(230,240,255,.35)", light: "#FFF3C4" },
    { id: "glow", name: "Glowmoss Wood", vi: "Rừng nấm phát sáng", night: true,
      sky: ["#06172A", "#0D3140", "#1B5A55"], hill: ["#0E3A3A", "#0A2A2C"], grassA: "#2E6B47", grassB: "#285F3F", path: "#3B4A3A", fog: "rgba(80,200,190,.18)", light: "#8FF5E8" },
    { id: "autumn", name: "Amber Ruins", vi: "Phế tích lá vàng", night: false,
      sky: ["#E0844A", "#F2B062", "#FBE2A2"], hill: ["#B0603A", "#8A4A34"], grassA: "#A8A13C", grassB: "#968F34", path: "#A57B52", fog: "rgba(255,210,150,.3)", light: "#FFD08A" },
    { id: "moon", name: "Moonspire Keep", vi: "Lâu đài trăng", night: true,
      sky: ["#120B2E", "#2C1E5A", "#5B3D82"], hill: ["#2A2350", "#1C1838"], grassA: "#4A5C6E", grassB: "#40525F", path: "#504868", fog: "rgba(170,140,255,.18)", light: "#C9B8FF" }
  ];
  D.LEVELS_PER_WORLD = 5;
  D.LEVEL_COUNT = D.WORLDS.length * D.LEVELS_PER_WORLD;

  // ---------- Bảng chữ ----------
  // Điểm của chữ cái (tự đặt theo độ hiếm)
  D.LETTER_PTS = { a: 1, b: 2, c: 2, d: 2, e: 1, f: 3, g: 2, h: 3, i: 1, j: 5, k: 4, l: 1, m: 2, n: 1, o: 1, p: 2, q: 5, r: 1, s: 1, t: 1, u: 1, v: 3, w: 3, x: 5, y: 3, z: 5 };
  // Gạch nhận được: 30 + 5 × điểm chữ, từ dài hơn 4 chữ thưởng thêm 5 gạch mỗi chữ (từ khó thì được nhiều hơn)
  D.wordGain = function (w) { var s = 0; for (var i = 0; i < w.length; i++) s += D.LETTER_PTS[w.charAt(i)] || 1; return 30 + s * 5 + Math.max(0, w.length - 4) * 5; };

  // Bảng chữ theo màn: dễ → khó. size = số ô mỗi cạnh, count = số từ ẩn, min/max = độ dài từ.
  D.BOARD_TIERS = [
    { upTo: 2,  size: 6, count: 5, min: 3, max: 4 },
    { upTo: 5,  size: 6, count: 6, min: 3, max: 5 },
    { upTo: 8,  size: 7, count: 6, min: 3, max: 5 },
    { upTo: 10, size: 7, count: 7, min: 4, max: 6 },
    { upTo: 13, size: 8, count: 7, min: 4, max: 6 },
    { upTo: 15, size: 8, count: 8, min: 4, max: 7 },
    { upTo: 18, size: 9, count: 8, min: 4, max: 8 },
    { upTo: 99, size: 9, count: 9, min: 5, max: 9 }
  ];
  D.boardSpec = function (level) {
    for (var i = 0; i < D.BOARD_TIERS.length; i++) if (level <= D.BOARD_TIERS[i].upTo) return D.BOARD_TIERS[i];
    return D.BOARD_TIERS[D.BOARD_TIERS.length - 1];
  };

  // Hướng đặt từ theo cấp
  D.boardDirs = function (level) {
    var d = [[1, 0], [0, 1]];
    if (level >= 4) d.push([1, 1]);
    if (level >= 9) d.push([1, -1]);
    if (level >= 13) d.push([-1, 0], [0, -1]);
    return d;
  };

  // ---------- Bộ sinh màn (đợt quái cố định theo số màn) ----------
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  D.rng = rng;

  D.buildLevel = function (level, coop) {
    var R = rng(level * 7919 + 13);
    var world = Math.min(D.WORLDS.length - 1, Math.floor((level - 1) / D.LEVELS_PER_WORLD));
    var isBoss = level % D.LEVELS_PER_WORLD === 0;
    var pool = D.MON_ORDER.filter(function (k) { return D.MONS[k].from <= level && k !== "boss"; });
    var mult = coop ? 1.6 : 1;
    var normal = Math.round((5 + level * 1.0) * mult);
    var ev = [], t = 24, gap = Math.max(7, 16 - level * 0.4);
    function pick() {
      // quái mạnh hiếm hơn
      var tot = 0, ws = pool.map(function (k) { var w = 1 / (0.6 + D.MONS[k].w); if (k === "imp") w *= 2.6; tot += w; return w; });
      var r = R() * tot; for (var i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; } return pool[0];
    }
    var half = Math.floor(normal / 2), flags = [];
    for (var i = 0; i < normal; i++) {
      ev.push({ t: t, mon: i < 2 ? "imp" : pick(), lane: Math.floor(R() * D.LANES) });
      t += gap * (0.75 + R() * 0.5) / (coop ? 1.25 : 1);
      if (i === half) { // đợt lớn giữa màn
        t += 6; flags.push(t);
        var n = Math.round((3 + level * 0.3) * mult);
        for (var j = 0; j < n; j++) ev.push({ t: t + j * 0.9, mon: pick(), lane: Math.floor(R() * D.LANES), big: true });
        t += n * 0.9 + 14;
      }
    }
    t += 8; flags.push(t);
    var n2 = Math.round((4 + level * 0.4) * mult);
    for (var k = 0; k < n2; k++) ev.push({ t: t + k * 0.8, mon: pick(), lane: Math.floor(R() * D.LANES), big: true });
    if (isBoss) ev.push({ t: t + n2 * 0.8 + 2, mon: "boss", lane: 2, big: true });
    ev.sort(function (a, b) { return a.t - b.t; });
    return { level: level, world: world, boss: isBoss, events: ev, flags: flags, end: ev[ev.length - 1].t };
  };

  D.heroesFor = function (cleared) { // cleared = số màn đã qua
    return D.HERO_ORDER.filter(function (k) { return D.HERO_UNLOCK[k] <= cleared; });
  };

  window.D = D;
})();
