(() => {
  "use strict";

  /* =========================================================
     BD HỆ THỐNG: mỗi người trao một bông hoa, một lời chúc.
     Sửa tên, lời chúc, dòng ký tên ở đây. Lời chúc hiện là bản nháp.
     tone: viền thẻ "pink" | "lilac"; flower: "pink" | "gold" | "lilac" | "mint"
     photo: ảnh đại diện trong ô tròn (ảnh vuông, tối thiểu 200x200).
            Chưa có file thì ô tròn tự hiện chữ viết tắt tên.
     ========================================================= */
  const TEAM = [
    {
      name: "Minh Hùm",
      photo: "img/team/hum.jpg",
      role: "BD Hệ thống",
      tone: "pink",
      flower: "pink",
      meaning: "Rạng rỡ",
      wish: "Nhân ngày 20/10, Hùm chúc những bông hoa xinh đẹp của LightHuman luôn giữ được nụ cười, sự tự tin và nguồn năng lượng tích cực vốn có. Cảm ơn mọi người vì đã mang đến sự ấm áp, tinh tế và những điều đẹp đẽ cho tập thể. Mong rằng mỗi ngày của các chị em đều ngập tràn yêu thương, được trân trọng và luôn hạnh phúc với những gì mình lựa chọn.",
      sign: "Mãi iu, Hùm",
    },
    {
      name: "Hòn Trợn",
      photo: "img/team/tron.jpg",
      role: "BD Hệ thống",
      tone: "lilac",
      flower: "gold",
      meaning: "Tươi vui",
      wish: "Chúc các chị em không chỉ có một ngày 20/10 thật vui mà cả 365 ngày trong năm đều được yêu thương đúng cách. Mong mọi người luôn đủ mạnh mẽ để theo đuổi ước mơ, đủ dịu dàng để tận hưởng cuộc sống và đủ tự tin để biết rằng mình xứng đáng với những điều tốt đẹp nhất. Hãy luôn là phiên bản tuyệt vời nhất của chính mình nhé!",
      sign: "Mãi iu, Trợn",
    },
    {
      name: "Tuấn Kẹc",
      photo: "img/team/kec.jpg",
      role: "BD Hệ thống",
      tone: "pink",
      flower: "lilac",
      meaning: "Bình an",
      wish: "Chúc các chị em nhà LightHuman ngày 20/10 luôn xinh đẹp như ảnh đã chỉnh màu, trẻ trung như tuổi trong CV và giàu có như số lần nói “để em làm cho”. Mong mọi người luôn rạng rỡ, vui vẻ, deadline né xa, lương về đúng hẹn và mỗi ngày đi làm đều được đối xử như công chúa, ít nhất là đến giờ tan ca!",
      sign: "Mãi iu, Kẹc",
    },
    {
      name: "Lê Bống",
      photo: "img/team/bong.jpg",
      role: "BD Hệ thống",
      tone: "lilac",
      flower: "mint",
      meaning: "Hạnh phúc",
      // \n xuống dòng: thẻ giữ nguyên ngắt dòng (white-space: pre-line)
      wish: "Chúc các chị em nhà LightHuman luôn:\n– Ví tiền dày hơn áp lực công việc.\n– Nụ cười nhiều hơn số CV cần lọc.\n– Tin nhắn phản hồi nhiều hơn số lần ứng viên “seen không rep”.\nVà luôn tìm được những ứng viên chất lượng nhanh hơn tốc độ quản lý yêu cầu tuyển gấp hệ hệ.",
      sign: "Mãi iu, Bống",
    },
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion.matches ? 0 : ms));

  // Neon palette, mirrors the tokens in styles.css
  const PINK = [255, 122, 184];
  const LILAC = [169, 155, 255];
  const MINT = [125, 255, 208];
  const GOLD = [255, 217, 138];
  const NEON = [PINK, LILAC, GOLD, PINK, MINT];
  const FLOWER_RGB = { pink: PINK, gold: GOLD, lilac: LILAC, mint: MINT };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));

  // Haptics on the big moments (Android; iOS has no Vibration API so this is a no-op there)
  const buzz = (pattern) => {
    if (reduceMotion.matches || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch { /* blocked before first tap */ }
  };

  document.documentElement.classList.add("js");

  const order = document.getElementById("order");
  const gift = document.getElementById("gift");
  const openBtn = document.getElementById("openGift");
  const openLabel = document.getElementById("openLabel");
  const stage2 = document.getElementById("stage2");
  const scene = document.getElementById("scene");
  const replayBtn = document.getElementById("replay");
  const bouquet = document.getElementById("bouquet");

  /* =========================================================
     MUSIC (Chăm Hoa mp3)
     ========================================================= */
  const song = document.getElementById("song");
  const musicBtn = document.getElementById("music");
  const musicLabel = document.getElementById("musicLabel");
  song.volume = 0.75;

  const setMusic = (state) => {
    const labels = {
      loading: ["Đang tải...", "Đang tải nhạc"],
      playing: ["Chăm Hoa", "Tạm dừng nhạc"],
      paused: ["Chăm Hoa", "Bật nhạc"],
      error: ["Lỗi nhạc", "Không tải được file nhạc"],
    };
    const [text, aria] = labels[state] || labels.paused;
    musicBtn.dataset.state = state;
    musicLabel.textContent = text;
    musicBtn.setAttribute("aria-label", aria);
    musicBtn.setAttribute("aria-pressed", String(state === "playing"));
    musicBtn.disabled = state === "error";
  };

  let userPaused = false;
  const playMusic = () => {
    if (userPaused) return;
    const p = song.play();
    if (p && p.catch) p.catch(() => { if (!song.error) setMusic("paused"); });
  };

  song.addEventListener("playing", () => setMusic("playing"));
  song.addEventListener("pause", () => setMusic("paused"));
  song.addEventListener("waiting", () => setMusic("loading"));
  song.addEventListener("error", () => setMusic("error"));

  // Beat analyser: drives the grass, the bouquet glow and the eq bars.
  // Only over http(s): on file:// the mp3 counts as cross-origin and Web Audio would play it silent.
  // Created only inside click handlers so the context never starts suspended.
  let actx = null;
  let analyser = null;
  let freq = null;
  const musicBars = [...musicBtn.querySelectorAll(".music__bars i")];
  const ensureAudio = () => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        const c = new AC();
        const a = c.createAnalyser();
        a.fftSize = 512;
        a.smoothingTimeConstant = 0.75;
        c.createMediaElementSource(song).connect(a);
        a.connect(c.destination);
        actx = c;
        analyser = a;
        freq = new Uint8Array(a.frequencyBinCount);
        musicBtn.classList.add("is-live");
      } catch {
        return;
      }
    }
    if (actx.state === "suspended") actx.resume();
  };

  // Sound effects reuse the music context, or get their own (file:// has no analyser context).
  // Also created inside the gift tap so it is allowed to start.
  let sfxCtx = null;
  const ensureSfx = () => {
    if (actx) return;
    if (!sfxCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { sfxCtx = new AC(); } catch { return; }
    }
    if (sfxCtx.state === "suspended") sfxCtx.resume();
  };

  // Camera shutter: two short filtered noise clicks ("click-clack")
  const shutter = () => {
    const c = actx || sfxCtx;
    if (!c || userPaused || c.state !== "running") return;
    const t = c.currentTime;
    [[0, 1700], [0.085, 2600]].forEach(([off, hz]) => {
      const len = Math.round(c.sampleRate * 0.045);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = hz;
      f.Q.value = 0.9;
      const g = c.createGain();
      g.gain.value = 0.45;
      src.connect(f).connect(g).connect(c.destination);
      src.start(t + off);
    });
  };

  // Bass, low-mid, mid, high (bins of ~86 Hz)
  const BANDS = [[1, 4], [4, 12], [12, 36], [36, 100]];
  const levels = [0, 0, 0, 0];
  let beat = 0;
  let lastBeat = -1;
  const readMusic = () => {
    const live = analyser && !song.paused;
    if (live) analyser.getByteFrequencyData(freq);
    BANDS.forEach(([a, b], k) => {
      let sum = 0;
      if (live) for (let i = a; i < b; i++) sum += freq[i];
      const target = live ? clamp((sum / (b - a) / 255 - 0.25) / 0.6, 0, 1) : 0;
      levels[k] += (target - levels[k]) * (target > levels[k] ? 0.5 : 0.12);
    });
    beat = levels[0] * 0.65 + levels[1] * 0.35;
    if (Math.abs(beat - lastBeat) > 0.01) {
      bouquet.style.setProperty("--beat", beat.toFixed(3));
      lastBeat = beat;
    }
    if (live) musicBars.forEach((bar, k) => { bar.style.transform = `scaleY(${(0.2 + 0.8 * levels[k]).toFixed(3)})`; });
  };

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (musicBtn.dataset.state === "playing") {
      userPaused = true;
      song.pause();
    } else {
      userPaused = false;
      ensureAudio();
      playMusic();
    }
  });

  playMusic();
  const kick = (e) => {
    if (e.target.closest && e.target.closest("#music")) return;
    if (song.paused) playMusic();
  };
  ["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, kick, { once: true }));

  /* =========================================================
     CANVAS FX: stars, neon grass, petals, planted blossoms, sparks
     ========================================================= */
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const cv = document.getElementById("fx");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  const stars = [];
  const blades = [];
  const petals = [];
  const blossoms = [];
  const sparks = [];
  const meteors = [];
  const flyers = [];
  const rockets = [];
  const trail = [];

  // Top layer (above the content): opening beam, particle text, screen flash
  const cvTop = document.getElementById("fxTop");
  const tctx = cvTop.getContext("2d");
  let topDirty = false;
  let beam = null;
  let morph = [];
  let morphT = 0;
  let flash = 0;

  // 0 = night, 1 = sunrise; follows the scroll (see updateDawn)
  let dawn = 0;

  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cvTop.width = W * dpr;
    cvTop.height = H * dpr;
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    const nStars = Math.min(220, Math.round((W * H) / 6500));
    for (let i = 0; i < nStars; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.4,
        t: Math.random() * 6.28,
        s: 0.6 + Math.random() * 1.6,
        col: Math.random() < 0.2 ? PINK : Math.random() < 0.4 ? LILAC : [255, 244, 250],
      });
    }

    blades.length = 0;
    const nBlades = Math.round(W / 6);
    for (let i = 0; i < nBlades; i++) {
      blades.push({
        x: (i / nBlades) * W + Math.random() * 4,
        h: (0.03 + Math.random() * 0.07) * H * (0.5 + 0.9 * Math.pow(Math.sin((i / nBlades) * 9 + 1), 2)),
        ph: Math.random() * 6.28,
        w: 1 + Math.random() * 1.1,
        col: pick([MINT, MINT, [110, 220, 255], PINK, LILAC]),
      });
    }
    if (reduceMotion.matches) drawStatic();
  };

  const petalPath = (r) => {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.7, r * 0.7, 0, r);
    ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.9, -r * 0.6, 0, -r);
  };

  const makePetal = (top) => ({
    x: Math.random() * W,
    y: top ? -20 : Math.random() * H,
    r: 5 + Math.random() * 6,
    vy: 22 + Math.random() * 30,
    vx: -6 + Math.random() * 12,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 1.6,
    ph: Math.random() * 6.28,
    col: pick([PINK, LILAC, GOLD]),
  });

  const drawStars = (dt) => {
    const fade = 1 - dawn * 0.85; // stars give way to the sunrise
    for (const s of stars) {
      s.t += dt * s.s;
      ctx.globalAlpha = (0.3 + 0.5 * Math.abs(Math.sin(s.t))) * fade;
      ctx.fillStyle = rgba(s.col, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawGrass = (tm) => {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    // The grass grows and sways harder on the beat
    const lift = 1 + beat * 0.5;
    for (const b of blades) {
      const sw = Math.sin(tm * 1.2 + b.ph + b.x * 0.004) * (4 + b.h * 0.12) * (1 + beat * 1.2);
      const h = b.h * lift;
      ctx.strokeStyle = rgba(b.col, 0.55 + beat * 0.35);
      ctx.lineWidth = b.w;
      ctx.beginPath();
      ctx.moveTo(b.x, H);
      ctx.quadraticCurveTo(b.x + sw * 0.3, H - h * 0.6, b.x + sw, H - h);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  // Outlined neon flower, same 6-petal shape as the SVG bouquet
  const drawFlower = (f) => {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.scale(f.scale, f.scale);
    ctx.globalAlpha = Math.min(1, f.life * 1.6);
    ctx.lineWidth = 1.6 / Math.max(f.scale, 0.3);
    ctx.strokeStyle = rgba(f.col, 1);
    ctx.fillStyle = rgba(f.col, 0.1);
    ctx.shadowColor = rgba(f.col, 0.9);
    ctx.shadowBlur = 12;
    for (let p = 0; p < 6; p++) {
      ctx.save();
      ctx.rotate((p / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -f.size * 0.5, f.size * 0.22, f.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, f.size * 0.16, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(GOLD, 1);
    ctx.shadowColor = rgba(GOLD, 0.9);
    ctx.stroke();
    ctx.restore();
  };

  let raf = 0;
  let last = performance.now();
  let meteorAcc = 0;

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);

    readMusic();
    drawStars(dt);
    drawGrass(now / 1000);

    // Meteors, rare
    meteorAcc += dt * 0.18;
    if (meteorAcc >= 1) {
      meteorAcc = 0;
      if (dawn < 0.4) meteors.push({ x: W * (0.3 + Math.random() * 0.7), y: Math.random() * H * 0.35, vx: -(380 + Math.random() * 220), vy: 150 + Math.random() * 100, life: 1 });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 1.1;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.16, m.y - m.vy * 0.16);
      g.addColorStop(0, `rgba(255,255,255,${m.life})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 0.16, m.y - m.vy * 0.16);
      ctx.stroke();
    }

    // Falling neon petals (outlined)
    ctx.lineWidth = 1.3;
    for (const p of petals) {
      p.ph += dt * 2;
      p.x += (p.vx + Math.sin(p.ph) * 18) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 20) Object.assign(p, makePetal(true));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.abs(Math.cos(p.ph)) * 0.6 + 0.4, 1);
      petalPath(p.r);
      ctx.fillStyle = rgba(p.col, 0.12);
      ctx.strokeStyle = rgba(p.col, 0.85);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Planted blossoms
    for (let i = blossoms.length - 1; i >= 0; i--) {
      const f = blossoms[i];
      f.scale += (1 - f.scale) * Math.min(1, dt * 7);
      f.rot += f.vr * dt;
      f.y += f.vy * dt;
      f.life -= dt * 0.22;
      if (f.life <= 0) { blossoms.splice(i, 1); continue; }
      drawFlower(f);
    }

    drawTrail(dt);
    if (charging) drawCharge(dt, now);
    if (cons.state !== "idle") drawConstellation(dt, now);

    // Flowers flying down from the bouquet into each wish card
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i];
      f.t = Math.min(1, f.t + dt / 1.2);
      const [tx, ty] = centerOf(f.target);
      const e = f.t < 0.5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2;
      const cx = (f.x0 + tx) / 2 + f.bend;
      const cy = (f.y0 + ty) / 2 - 60;
      const u = 1 - e;
      const x = u * u * f.x0 + 2 * u * e * cx + e * e * tx;
      const y = u * u * f.y0 + 2 * u * e * cy + e * e * ty;
      f.rot += dt * 5;
      if (Math.random() < 0.7) sparks.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.55, col: f.col });
      drawFlower({ x, y, rot: f.rot, scale: 0.7 + 0.3 * e, size: 18, life: 1, col: f.col });
      if (f.t >= 1) { flyers.splice(i, 1); f.onArrive(); }
    }

    // Firework rockets
    ctx.lineWidth = 2.4;
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx * dt; r.y += r.vy * dt;
      if (r.y <= r.ty) { rockets.splice(i, 1); explodeFlower(r.x, r.y, r.col); continue; }
      const g = ctx.createLinearGradient(r.x, r.y, r.x - r.vx * 0.08, r.y - r.vy * 0.08);
      g.addColorStop(0, rgba(r.col, 1));
      g.addColorStop(1, rgba(r.col, 0));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.vx * 0.08, r.y - r.vy * 0.08);
      ctx.stroke();
      if (Math.random() < 0.5) sparks.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 30, vy: 40, life: 0.5, col: GOLD });
    }

    // Sparks
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy += 90 * dt; s.vx *= 0.985;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.8;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, s.life);
      ctx.fillStyle = rgba(s.col, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    drawTop(dt);
    raf = requestAnimationFrame(frame);
  };

  /* ---------- Light trail: drag the mouse / slide a finger to paint with neon ---------- */
  let trailDist = 0;
  const addTrail = (x, y) => {
    if (stage2.hidden || reduceMotion.matches) return;
    const l = trail[trail.length - 1];
    if (l) {
      const d = Math.hypot(x - l.x, y - l.y);
      if (d < 4) return;
      trailDist += d;
      // every so often a little flower blooms along the stroke
      if (trailDist > 70) {
        trailDist = 0;
        blossoms.push({ x, y, col: pick([PINK, LILAC, GOLD]), size: 10 + Math.random() * 8, scale: 0, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2, vy: -6, life: 0.7 });
      }
    }
    trail.push({ x, y, life: 1, col: mix(PINK, LILAC, (Math.sin(performance.now() / 400) + 1) / 2) });
    if (trail.length > 90) trail.shift();
  };

  function drawTrail(dt) {
    for (const p of trail) p.life -= dt * 0.9;
    while (trail.length && trail[0].life <= 0) trail.shift();
    if (trail.length < 2) return;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const al = Math.min(a.life, b.life);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(b.col, 0.18 * al); // soft halo
      ctx.lineWidth = 9 * al;
      ctx.stroke();
      ctx.strokeStyle = rgba(b.col, 0.9 * al); // bright core
      ctx.lineWidth = 0.6 + 2.2 * al;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- Hold the bouquet to charge, release for a big bloom ---------- */
  let charging = false;
  let charge = 0;
  let lastBuzz = 0;

  function drawCharge(dt, now) {
    charge = Math.min(1, charge + dt / 1.6);
    bouquet.style.setProperty("--charge", charge.toFixed(3));
    const [bx, by] = centerOf(bouquet);
    const R = bouquet.offsetWidth * 0.62 * (charge >= 1 ? 1 + 0.03 * Math.sin(now / 70) : 1);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba(PINK, 0.18);
    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.stroke();
    const col = charge >= 1 ? GOLD : mix(PINK, GOLD, charge);
    ctx.strokeStyle = rgba(col, 0.95);
    ctx.shadowColor = rgba(col, 1);
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(bx, by, R, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // light gets sucked into the bouquet
    if (Math.random() < 0.3 + charge * 0.7) {
      const a = Math.random() * 6.283;
      sparks.push({ x: bx + Math.cos(a) * R * 1.3, y: by + Math.sin(a) * R * 1.3, vx: -Math.cos(a) * R * 1.6, vy: -Math.sin(a) * R * 1.6, life: 0.55, col: pick([PINK, GOLD, LILAC]) });
    }
    if (now - lastBuzz > 300 - 180 * charge) {
      lastBuzz = now;
      buzz(Math.round(8 + 22 * charge));
    }
  }

  /* ---------- Constellation: stars join into the LightHuman fan mark ---------- */
  // Vertices traced from the logo file (source pixels; the mark's box starts at 228,55 and is 155x91,
  // the same crop as img/logo-mark.png, so the stars sit on the faint mark behind them).
  // Folded blades fan out from a hub near the top: 5 big ones below, 3 slim ones and 2 spikes above.
  const MARK_BOX = [228, 55, 155, 91];
  const V = {
    H: [295, 70],                                   // hub
    TLs: [280, 57], TRs: [303, 60],                 // small spikes
    UL: [252, 65], ULb: [260, 76],                  // slim blade, upper left
    UR: [341, 57], URb: [333, 68],                  // slim blade, upper right
    RU: [372, 70], RUb: [362, 81],                  // slim blade, right
    L: [230, 83], Lb: [258, 127], Lf: [263, 96],    // big blade, left (tip, bottom, fold)
    M: [279, 143], Mf: [287, 104],                  // big blade, left of centre
    C: [296, 148],                                  // thin centre blade
    CRf: [300, 118], CR: [325, 146],                // big blade, right of centre
    Rf: [342, 99], Rb: [356, 132], R: [384, 87],    // big blade, right
  };
  const names = Object.keys(V);
  const idx = Object.fromEntries(names.map((k, i) => [k, i]));
  const CONS_PTS = names.map((k) => [(V[k][0] - MARK_BOX[0]) / MARK_BOX[2], (V[k][1] - MARK_BOX[1]) / MARK_BOX[3]]);
  const FOLDS = new Set(["ULb", "URb", "RUb", "Lf", "Mf", "CRf", "Rf"].map((k) => idx[k]));

  // First every ray shoots out from the hub (left to right), then the blade edges close up
  const RAYS = ["TLs", "UL", "ULb", "L", "Lf", "Mf", "C", "CRf", "Rf", "R", "RUb", "RU", "URb", "UR", "TRs"];
  const EDGES = [
    ["UL", "ULb"], ["L", "Lb"], ["Lb", "Lf"], ["Lf", "M"], ["M", "Mf"], ["Mf", "C"],
    ["CRf", "CR"], ["CR", "Rf"], ["R", "Rb"], ["Rb", "Rf"], ["RU", "RUb"], ["UR", "URb"],
  ];
  const CONS_LINES = [
    ...RAYS.map((k, i) => [idx.H, idx[k], 0.3 + i * 0.07, 0.5]),
    ...EDGES.map(([a, b], j) => [idx[a], idx[b], 1.5 + j * 0.11, 0.35]),
  ]; // [from, to, start (s), duration (s)]
  // A star lights up the moment the first line reaches it
  const STAR_AT = CONS_PTS.map(() => Infinity);
  STAR_AT[idx.H] = 0;
  for (const [a, b, t0, dur] of CONS_LINES) {
    STAR_AT[a] = Math.min(STAR_AT[a], t0);
    STAR_AT[b] = Math.min(STAR_AT[b], t0 + dur * 0.9);
  }
  const CONS_END = 3.4;
  const cons = { state: "idle", t: 0 };

  function drawConstellation(dt, now) {
    cons.t += dt;
    const r = finaleSky.getBoundingClientRect();
    if (cons.state === "drawing" && cons.t > CONS_END) {
      cons.state = "done";
      finale.classList.add("is-done");
      fireworks();
      buzz([20, 60, 30]);
    }
    if (r.bottom < -50 || r.top > H + 50) return;
    const P = CONS_PTS.map(([px, py]) => [r.left + px * r.width, r.top + py * r.height]);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgba(GOLD, 0.6);
    ctx.shadowColor = rgba(GOLD, 0.9);
    ctx.shadowBlur = 8;
    for (const [a, b, t0, dur] of CONS_LINES) {
      const k = smooth((cons.t - t0) / dur);
      if (k <= 0) continue;
      const [x1, y1] = P[a];
      const [x2, y2] = P[b];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
      ctx.stroke();
    }
    ctx.shadowBlur = 16;
    P.forEach(([x, y], i) => {
      const k = smooth((cons.t - STAR_AT[i]) / 0.35);
      if (k <= 0) return;
      const tw = 0.75 + 0.25 * Math.sin(now / 300 + i * 1.7);
      ctx.fillStyle = rgba([255, 240, 200], tw * k);
      ctx.beginPath();
      ctx.arc(x, y, (i === idx.H ? 4 : FOLDS.has(i) ? 2 : 2.8) * k, 0, Math.PI * 2);
      ctx.fill();
    });
    // four-point sparkle on the hub
    const [ax, ay] = P[idx.H];
    const s = 14 * smooth(cons.t / 0.4) * (0.8 + 0.2 * Math.sin(now / 200));
    ctx.strokeStyle = rgba([255, 240, 200], 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax - s, ay); ctx.lineTo(ax + s, ay);
    ctx.moveTo(ax, ay - s); ctx.lineTo(ax, ay + s);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Gift opening: beam of light, particles gather into "20/10", then scatter ---------- */
  const textTargets = (n) => {
    const oc = document.createElement("canvas");
    oc.width = W;
    oc.height = H;
    const o = oc.getContext("2d");
    const fs = Math.round(Math.min(W * 0.26, H * 0.28, 240));
    // sans-serif on purpose: monospace fonts slash or dot their zeros, which reads as "28/19"
    o.font = `800 ${fs}px "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText("20/10", W / 2, H * 0.42);
    const d = o.getImageData(0, 0, W, H).data;
    const step = fs > 150 ? 3 : 2;
    const pts = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    }
    const out = [];
    for (let i = 0; i < n && pts.length; i++) out.push(pts[Math.floor(Math.random() * pts.length)]);
    return out;
  };

  const startMorph = (gx, gy) => {
    if (reduceMotion.matches) return;
    const n = W < 640 ? 480 : 1200;
    const targets = textTargets(n);
    morph = targets.map(([tx, ty]) => ({
      x: gx + (Math.random() - 0.5) * 20,
      y: gy + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 300,
      vy: -(300 + Math.random() * 520),
      tx, ty,
      delay: 0.15 + Math.random() * 0.4,
      k: Math.random() * 3,
      mode: "gather",
      life: 1,
      col: pick([PINK, PINK, PINK, LILAC, GOLD, [255, 240, 248]]),
    }));
    morphT = 0;
    beam = { x: gx, y: gy, life: 1 };
    topDirty = true;
  };

  const scatterMorph = () => {
    for (const p of morph) {
      const a = Math.atan2(p.y - H * 0.42, p.x - W / 2) + (Math.random() - 0.5) * 0.6;
      const v = 120 + Math.random() * 360;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v - 80;
      p.mode = "fall";
      p.life = 0.8 + Math.random() * 0.6;
    }
    flash = 1;
    topDirty = true;
  };

  function drawTop(dt) {
    if (!topDirty) return;
    tctx.clearRect(0, 0, W, H);
    let busy = false;
    tctx.globalCompositeOperation = "lighter";

    if (beam) {
      beam.life -= dt * 1.1;
      if (beam.life <= 0) beam = null;
      else {
        busy = true;
        const w = 26 + 70 * (1 - beam.life);
        const g = tctx.createLinearGradient(beam.x, beam.y, beam.x, 0);
        g.addColorStop(0, rgba([255, 235, 245], 0.9 * beam.life));
        g.addColorStop(1, rgba(PINK, 0));
        tctx.fillStyle = g;
        tctx.fillRect(beam.x - w / 2, 0, w, beam.y);
        const rg = tctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, 160);
        rg.addColorStop(0, rgba([255, 230, 240], 0.7 * beam.life));
        rg.addColorStop(1, rgba(PINK, 0));
        tctx.fillStyle = rg;
        tctx.fillRect(beam.x - 160, beam.y - 160, 320, 320);
      }
    }

    if (morph.length) {
      busy = true;
      morphT += dt;
      for (let i = morph.length - 1; i >= 0; i--) {
        const p = morph[i];
        if (p.mode === "gather") {
          if (morphT < p.delay) {
            p.vy += 500 * dt;
            p.vx *= 0.98;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          } else {
            const k = 1 - Math.exp(-dt * (5 + p.k));
            p.x += (p.tx - p.x) * k;
            p.y += (p.ty - p.y) * k;
          }
          p.a = 0.75 + 0.25 * Math.sin(morphT * 9 + i);
        } else {
          p.vy += 260 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 0.9;
          if (p.life <= 0) { morph.splice(i, 1); continue; }
          p.a = Math.min(1, p.life);
        }
        // soft halo + bright core, so the dots read as neon rather than pixels
        tctx.fillStyle = rgba(p.col, p.a * 0.16);
        tctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        tctx.fillStyle = rgba(p.col, p.a);
        tctx.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
      }
    }

    tctx.globalCompositeOperation = "source-over";
    if (flash > 0) {
      busy = true;
      tctx.fillStyle = `rgba(255,236,246,${(flash * 0.5).toFixed(3)})`;
      tctx.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - dt * 2.2);
    }
    topDirty = busy;
  }

  // Reduced motion: one still frame of stars + grass, no loop
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    drawStars(0);
    drawGrass(0);
  }

  const start = () => {
    if (!raf && !document.hidden && !reduceMotion.matches) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  const burst = (x, y, count = 40, power = 220, cols = NEON) => {
    if (reduceMotion.matches) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 6.283 + Math.random() * 0.2;
      const v = power * (0.4 + Math.random() * 0.6);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: pick(cols) });
    }
  };

  // Firework shell that bursts into a 6-petal flower (rose curve |cos 3θ|) with a gold heart
  function explodeFlower(x, y, col) {
    const n = 108;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = 340 * (0.18 + 0.82 * Math.abs(Math.cos(3 * a))) * (0.92 + Math.random() * 0.16);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.15, col });
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      sparks.push({ x, y, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, life: 0.9, col: GOLD });
    }
    buzz(15);
  }

  let fireTimers = [];
  const fireworks = () => {
    if (reduceMotion.matches) return;
    [0, 380, 760, 1200, 1650].forEach((ms) => fireTimers.push(setTimeout(() => {
      rockets.push({
        x: W * (0.18 + Math.random() * 0.64),
        y: H + 10,
        vx: (Math.random() - 0.5) * 60,
        vy: -(H * 1.1 + Math.random() * H * 0.3),
        ty: H * (0.14 + Math.random() * 0.26),
        col: pick(NEON),
      });
    }, ms)));
  };
  const clearFireworks = () => {
    fireTimers.forEach(clearTimeout);
    fireTimers = [];
    rockets.length = 0;
  };

  const plantFlower = (x, y) => {
    if (reduceMotion.matches) return;
    blossoms.push({
      x, y,
      col: pick([PINK, LILAC, GOLD]),
      size: 22 + Math.random() * 16,
      scale: 0,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.8,
      vy: -10 - Math.random() * 18,
      life: 1,
    });
    burst(x, y, 14, 120);
  };

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  // Tap empty space on the scene to plant a blossom
  window.addEventListener("click", (e) => {
    if (stage2.hidden) return;
    if (e.target.closest && e.target.closest("button, a")) return;
    plantFlower(e.clientX, e.clientY);
  });

  // A hold that ends in a bloom swallows the click that follows it
  let suppressClick = false;

  const bloomBurst = (c) => {
    const [bx, by] = centerOf(bouquet);
    burst(bx, by, Math.round(60 + 260 * c), 220 + 420 * c);
    explodeFlower(bx, by, PINK);
    if (c > 0.6) explodeFlower(bx, by, GOLD);
    const n = 3 + Math.round(12 * c);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const d = Math.random() * (120 + 260 * c);
      plantFlower(bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.7);
    }
    flash = 0.35 * c;
    topDirty = true;
    buzz([40, 30, 80]);
    // every flower spins and re-blooms
    bouquet.classList.remove("is-bloom");
    void bouquet.offsetWidth;
    bouquet.classList.add("is-bloom");
    setTimeout(() => bouquet.classList.remove("is-bloom"), 1000);
  };

  bouquet.addEventListener("pointerdown", () => {
    if (reduceMotion.matches || !raf) return;
    charging = true;
    charge = 0;
    bouquet.classList.add("is-charging");
  });
  const release = (e) => {
    if (!charging) return;
    charging = false;
    bouquet.classList.remove("is-charging");
    bouquet.style.setProperty("--charge", "0");
    if (charge > 0.15) {
      suppressClick = e.type === "pointerup"; // only a pointerup is followed by a click
      bloomBurst(charge);
    }
    charge = 0;
  };
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => bouquet.addEventListener(ev, release));
  bouquet.addEventListener("contextmenu", (e) => e.preventDefault()); // no long-press menu on phones

  // Paint with light: mouse drag on desktop, finger slide (even while scrolling) on phones
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && e.buttons & 1) addTrail(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (t) addTrail(t.clientX, t.clientY);
  }, { passive: true });

  bouquet.addEventListener("click", () => {
    if (suppressClick) { suppressClick = false; return; }
    const [bx, by] = centerOf(bouquet);
    burst(bx, by, 50, 260);
    for (let i = 0; i < 3; i++) plantFlower(bx + (Math.random() - 0.5) * 220, by + (Math.random() - 0.5) * 160);
  });

  /* =========================================================
     STORY: letter, stacked notes, group photo, progress rail
     ========================================================= */
  const letter = document.getElementById("letter");
  const notesEl = document.getElementById("notes");
  const paperTeam = document.getElementById("paperTeam");
  const photo = document.getElementById("photo");
  const polaroids = photo.querySelector(".polaroids");
  const finale = document.getElementById("finale");
  const finaleSky = document.getElementById("finaleSky");
  const story = document.querySelector(".story");
  const storyDots = [...story.querySelectorAll(".story__dot")];
  const scrollDriven = CSS.supports("animation-timeline: view()");

  const initials = (name) => {
    const parts = name.trim().split(/\s+/);
    const two = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return two.toUpperCase();
  };

  // Initials first; swap in the photo only once it has loaded, so a missing file keeps the initials
  const setAvatar = (slot, m) => {
    slot.textContent = initials(m.name);
    if (!m.photo) return;
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.onload = () => {
      slot.textContent = "";
      slot.append(img);
      slot.classList.add("has-photo");
    };
    img.src = m.photo;
  };

  // The wish is typed into .wish__typed while .wish__ghost holds the rest as invisible text,
  // so the card keeps its final height and screen readers always get the whole sentence.
  const notes = TEAM.map((m, i) => {
    const el = document.createElement("article");
    el.className = `note note--${m.tone === "lilac" ? "lilac" : "pink"}`;
    el.dataset.flower = m.flower;
    el.style.setProperty("--i", i);
    el.innerHTML = `
      <div class="note__card">
        <header class="note__head">
          <span class="note__avatar" aria-hidden="true"></span>
          <div><h3 class="note__name"></h3><p class="note__role"></p></div>
        </header>
        <p class="note__gift">
          <svg class="note__flower" viewBox="-26 -26 52 52" aria-hidden="true"><use href="#flw" /></svg>
          <span>trao bông</span> <strong></strong>
        </p>
        <p class="note__wish"><span class="wish__typed"></span><span class="wish__caret" aria-hidden="true"></span><span class="wish__ghost"></span></p>
        <p class="note__sign">
          <span class="sr-only"></span>
          <svg class="sign__svg" aria-hidden="true"><text x="100%" y="72%" dx="-4" text-anchor="end"></text></svg>
          <i class="ph-light ph-heart" aria-hidden="true"></i>
        </p>
      </div>`;
    setAvatar(el.querySelector(".note__avatar"), m);
    el.querySelector(".note__name").textContent = m.name;
    el.querySelector(".note__role").textContent = m.role;
    el.querySelector(".note__gift strong").textContent = m.meaning;
    el.querySelector(".note__sign .sr-only").textContent = m.sign;
    el.querySelector(".sign__svg text").textContent = m.sign;
    notesEl.append(el);

    const chip = document.createElement("span");
    setAvatar(chip, m);
    paperTeam.append(chip);

    const n = {
      el,
      wish: m.wish.normalize("NFC"),
      col: FLOWER_RGB[m.flower] || PINK,
      icon: el.querySelector(".note__flower"),
      typed: el.querySelector(".wish__typed"),
      ghost: el.querySelector(".wish__ghost"),
      raf: 0,
      started: false,
    };
    n.ghost.textContent = n.wish;
    return n;
  });

  /* ---------- Wish cards: flower flies in, wish types out, signature draws ---------- */
  const PAUSE = { ",": 120, ".": 260, ":": 180, "!": 260, "?": 260, "\n": 320 };

  const typeWish = (n, done) => {
    const chars = Array.from(n.wish);
    const at = [];
    let t = 0;
    for (const c of chars) { t += 18; at.push(t); t += PAUSE[c] || 0; }
    let shown = 0;
    const t0 = performance.now();
    n.el.classList.add("is-typing");
    const step = (now) => {
      let k = shown;
      while (k < chars.length && at[k] <= now - t0) k++;
      if (k !== shown) {
        shown = k;
        n.typed.textContent = chars.slice(0, k).join("");
        n.ghost.textContent = chars.slice(k).join("");
      }
      if (shown < chars.length) { n.raf = requestAnimationFrame(step); return; }
      n.raf = 0;
      n.el.classList.remove("is-typing");
      done();
    };
    n.raf = requestAnimationFrame(step);
  };

  const finishNote = (n) => {
    cancelAnimationFrame(n.raf);
    n.raf = 0;
    n.typed.textContent = n.wish;
    n.ghost.textContent = "";
    n.el.classList.remove("is-typing");
    n.el.classList.add("is-received", "is-signed");
  };

  const resetNote = (n) => {
    cancelAnimationFrame(n.raf);
    n.raf = 0;
    n.started = false;
    n.typed.textContent = "";
    n.ghost.textContent = n.wish;
    n.el.classList.remove("is-typing", "is-received", "is-signed");
  };

  const startNote = (n) => {
    if (n.started) return;
    n.started = true;
    if (reduceMotion.matches || !raf) { finishNote(n); return; }
    flyers.push({
      target: n.icon,
      col: n.col,
      x0: W / 2 + (Math.random() - 0.5) * W * 0.2,
      y0: -30,
      bend: (Math.random() < 0.5 ? -1 : 1) * Math.min(W * 0.3, 220),
      t: 0,
      rot: 0,
      onArrive: () => {
        n.el.classList.add("is-received");
        const [x, y] = centerOf(n.icon);
        burst(x, y, 18, 120, [n.col, GOLD]);
        typeWish(n, () => n.el.classList.add("is-signed"));
      },
    });
  };

  const noteByEl = new Map(notes.map((n) => [n.el, n]));
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !stage2.hidden) startNote(noteByEl.get(en.target));
    });
  }, { rootMargin: "0px 0px -40% 0px" });
  notes.forEach((n) => revealIO.observe(n.el));

  /* ---------- Neon titles flicker on like a real sign when they come into view ---------- */
  const neons = [...document.querySelectorAll(".neon")];
  const neonIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("is-lit"); });
  }, { threshold: 0.6 });
  neons.forEach((el) => neonIO.observe(el));

  /* ---------- 3D tilt of the wish cards: mouse on desktop, gyroscope on phones ---------- */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let tiltFrame = 0;
  let tiltX = 0;
  let tiltY = 0;
  const setTilt = (x, y) => {
    tiltX = x;
    tiltY = y;
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      tiltFrame = 0;
      const s = notesEl.style;
      s.setProperty("--rx", `${(-tiltY * 5).toFixed(2)}deg`);
      s.setProperty("--ry", `${(tiltX * 7).toFixed(2)}deg`);
      s.setProperty("--gx", `${(50 + tiltX * 45).toFixed(1)}%`);
      s.setProperty("--gy", `${(50 + tiltY * 45).toFixed(1)}%`);
    });
  };

  window.addEventListener("pointermove", (e) => {
    if (!finePointer.matches || reduceMotion.matches || stage2.hidden) return;
    setTilt((e.clientX / W) * 2 - 1, (e.clientY / H) * 2 - 1);
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => setTilt(0, 0));

  let gyroOn = false;
  let baseBeta = null;
  const onOrient = (e) => {
    if (e.gamma == null || reduceMotion.matches || stage2.hidden) return;
    if (baseBeta === null) baseBeta = e.beta;
    setTilt(clamp(e.gamma / 25, -1, 1), clamp((e.beta - baseBeta) / 25, -1, 1));
  };
  // iOS asks for permission, so this has to run synchronously inside the gift tap
  const enableGyro = () => {
    if (gyroOn || finePointer.matches || reduceMotion.matches || !("DeviceOrientationEvent" in window)) return;
    gyroOn = true;
    const listen = () => window.addEventListener("deviceorientation", onOrient);
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then((s) => { if (s === "granted") listen(); }).catch(() => {});
    } else {
      listen();
    }
  };

  const passed = (en) => en.isIntersecting || en.boundingClientRect.top < 0;
  const midline = { rootMargin: "0px 0px -50% 0px" };

  // Envelope steps: classes drive the fallback; a spark burst marks the tear everywhere
  let tornOnce = false;
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const step = en.target.dataset.step;
      const on = passed(en);
      if (!scrollDriven) letter.classList.toggle(`is-${step}`, on);
      if (step !== "torn") return;
      if (on && !tornOnce && !stage2.hidden) {
        tornOnce = true;
        buzz(30);
        const env = letter.querySelector(".envelope").getBoundingClientRect();
        burst(env.left + env.width / 2, env.top + env.height * 0.2, 44, 240);
      }
      if (!on) tornOnce = false;
    });
  }, midline);
  letter.querySelectorAll(".letter__mark").forEach((m) => stepIO.observe(m));

  // Camera flash (on that photo only) + shutter the moment a polaroid finishes developing
  const shoot = (n) => {
    const pol = photo.querySelector(`.polaroid--${n}`);
    if (reduceMotion.matches || !pol) return;
    pol.classList.remove("is-flash");
    void pol.offsetWidth;
    pol.classList.add("is-flash");
    shutter();
    buzz(25);
  };

  // Photo finale: develop (fallback), flashes, celebration
  let cheered = false;
  const shot = new Set();
  const photoIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const on = passed(en);
      if (en.target.dataset.step === "flash") {
        if (on && !shot.has(en.target) && !stage2.hidden) { shot.add(en.target); shoot(en.target.dataset.shot); }
        if (!on) shot.delete(en.target);
        return;
      }
      if (!scrollDriven) photo.classList.toggle("is-in", on);
      if (on && !cheered && !stage2.hidden) {
        cheered = true;
        const r = polaroids.getBoundingClientRect();
        burst(r.left + r.width * 0.2, r.top + r.height * 0.3, 50, 300);
        burst(r.right - r.width * 0.2, r.top + r.height * 0.3, 50, 300);
        for (let k = 0; k < 6; k++) plantFlower(r.left + Math.random() * r.width, r.top + Math.random() * r.height);
      }
      if (!on) cheered = false;
    });
  }, midline);
  photo.querySelectorAll(".photo__mark").forEach((m) => photoIO.observe(m));

  // Finale: draw the constellation once the sky is half in view; replay it on every visit
  const resetConstellation = () => {
    cons.state = "idle";
    cons.t = 0;
    finale.classList.remove("is-done");
  };
  const finaleIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) { resetConstellation(); return; }
      if (en.intersectionRatio < 0.5 || cons.state !== "idle" || stage2.hidden) return;
      if (reduceMotion.matches || !raf) { cons.state = "done"; finale.classList.add("is-done"); return; }
      cons.state = "drawing";
      cons.t = 0;
    });
  }, { threshold: [0, 0.5] });
  finaleIO.observe(finaleSky);

  /* ---------- Night to sunrise: the sky brightens toward the group photo, then night returns for the stars ---------- */
  const root = document.documentElement;
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const updateDawn = () => {
    let d = 0;
    if (!stage2.hidden) {
      const mid = window.scrollY + H / 2;
      const a = docTop(letter);
      const b = docTop(photo) + photo.offsetHeight * 0.45;
      const f = docTop(finale);
      d = smooth((mid - a) / (b - a)) * (1 - smooth((mid - (f - H * 0.5)) / (H * 0.8)));
    }
    if (Math.abs(d - dawn) > 0.004 || (d === 0 && dawn !== 0)) {
      dawn = d;
      root.style.setProperty("--dawn", d.toFixed(3));
    }
  };
  let dawnFrame = 0;
  window.addEventListener("scroll", () => {
    if (dawnFrame) return;
    dawnFrame = requestAnimationFrame(() => { dawnFrame = 0; updateDawn(); });
  }, { passive: true });

  if (!scrollDriven) {
    const noteIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); noteIO.unobserve(en.target); } });
    }, { threshold: 0.2 });
    notesEl.querySelectorAll(".note").forEach((n) => noteIO.observe(n));
  }

  // Story rail: highlight the chapter crossing the middle of the screen
  const chapters = storyDots.map((d) => document.getElementById(d.dataset.chapter));
  const chapterIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const idx = chapters.indexOf(en.target);
      storyDots.forEach((d, k) => {
        d.classList.toggle("is-active", k === idx);
        if (k === idx) d.setAttribute("aria-current", "step");
        else d.removeAttribute("aria-current");
      });
      story.style.setProperty("--story", String(idx / (chapters.length - 1)));
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  chapters.forEach((c) => chapterIO.observe(c));

  /* =========================================================
     FLOW: gift -> open -> bouquet & story
     ========================================================= */
  scene.querySelectorAll(".pop").forEach((el, i) => el.style.setProperty("--i", i + 1));

  let busy = false;
  const openGift = async () => {
    if (busy) return;
    busy = true;
    enableGyro();
    ensureAudio();
    ensureSfx();
    openBtn.disabled = true;
    openBtn.setAttribute("aria-busy", "true");
    openLabel.textContent = "Đang mở...";
    playMusic();

    // Lid pops, a beam shoots up and the light gathers into "20/10"
    gift.classList.add("is-open");
    const [gx, gy] = centerOf(gift);
    burst(gx, gy, 90, 320);
    startMorph(gx, gy);
    buzz([25, 40, 60]);
    await wait(500);

    order.classList.add("is-leaving");
    await wait(700);
    order.hidden = true;
    await wait(900); // let the "20/10" hang in the dark for a beat

    // ...then it bursts into petals and the bouquet grows out of the flash
    scatterMorph();
    buzz(40);
    stage2.hidden = false;
    void scene.offsetWidth;
    scene.classList.add("is-in");
    window.scrollTo({ top: 0, behavior: "instant" });
    updateDawn();

    await wait(500);
    const [bx, by] = centerOf(bouquet);
    burst(bx, by, 60, 280);
    busy = false;
  };

  const replay = () => {
    scene.classList.remove("is-in");
    stage2.hidden = true;
    letter.classList.remove("is-torn", "is-out");
    photo.classList.remove("is-in");
    notes.forEach(resetNote);
    neons.forEach((el) => el.classList.remove("is-lit"));
    flyers.length = 0;
    clearFireworks();
    trail.length = 0;
    morph = [];
    beam = null;
    resetConstellation();
    shot.clear();
    window.scrollTo({ top: 0, behavior: "instant" });
    updateDawn();
    gift.classList.remove("is-open");
    order.hidden = false;
    void order.offsetWidth;
    order.classList.remove("is-leaving");
    openBtn.disabled = false;
    openBtn.removeAttribute("aria-busy");
    openLabel.textContent = "Mở hộp quà";
    openBtn.focus();
  };

  gift.addEventListener("click", openGift);
  openBtn.addEventListener("click", openGift);
  replayBtn.addEventListener("click", replay);

  /* ---------- Lifecycle ---------- */
  window.addEventListener("resize", () => { resize(); updateDawn(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener("change", () => (reduceMotion.matches ? (stop(), drawStatic()) : start()));

  resize();
  const count = W < 640 ? 12 : 22;
  for (let i = 0; i < count; i++) petals.push(makePetal(false));
  start();
  setTimeout(() => openBtn.focus({ preventScroll: true }), 50);
})();
