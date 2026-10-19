(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion.matches ? 0 : ms));

  // Diverse pastel palette: Xanh dương, Vàng, Xanh lá mint/sage, Hồng phấn, Tím lavender, Cam đào
  const YELLOW = [253, 224, 71];    // Vàng pastel nắng tươi
  const BLUE = [125, 211, 252];      // Xanh dương pastel
  const GREEN = [134, 239, 172];     // Xanh lá pastel / mint
  const PINK = [244, 114, 182];      // Hồng phấn
  const LILAC = [196, 181, 253];     // Tím lavender
  const PEACH = [251, 146, 60];      // Cam đào
  const GOLD = [245, 158, 11];       // Nhụy vàng hổ phách
  const WHITE = [255, 255, 255];

  const PASTEL_PALETTE = [BLUE, YELLOW, GREEN, PINK, LILAC, PEACH];

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  const order = document.getElementById("order");
  const gift = document.getElementById("gift");
  const openBtn = document.getElementById("openGift");
  const scene = document.getElementById("scene");
  const replayBtn = document.getElementById("replay");

  /* =========================================================
     MUSIC (local mp3)
     ========================================================= */
  const song = document.getElementById("song");
  const musicBtn = document.getElementById("music");
  const musicLabel = document.getElementById("musicLabel");
  song.volume = 0.75;

  const setMusic = (state) => {
    const labels = {
      loading: ["Đang tải nhạc", "Đang tải nhạc"],
      playing: ["Chăm Hoa", "Tạm dừng nhạc"],
      paused: ["Bật nhạc", "Bật nhạc"],
      error: ["Lỗi nhạc", "Không tải được file nhạc"],
    };
    const [text, aria] = labels[state];
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

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (musicBtn.dataset.state === "playing") { userPaused = true; song.pause(); }
    else { userPaused = false; playMusic(); }
  });

  playMusic();
  const kick = (e) => {
    if (e.target.closest && e.target.closest("#music")) return;
    if (song.paused) playMusic();
  };
  ["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, kick, { once: true }));

  /* =========================================================
     PETALS + SPARKS + PLANTED FLOWERS (Background canvas)
     ========================================================= */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pCanvas = document.getElementById("petals");
  const pCtx = pCanvas.getContext("2d");
  let pW = 0, pH = 0;
  const petals = [];
  const sparks = [];
  const plantedFlowers = [];

  const sizePetals = () => {
    pW = window.innerWidth; pH = window.innerHeight;
    pCanvas.width = pW * dpr; pCanvas.height = pH * dpr;
    pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const makePetal = (top) => {
    const isLeaf = Math.random() < 0.22;
    const col = isLeaf ? GREEN : PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    return {
      x: Math.random() * pW,
      y: top ? -20 - Math.random() * pH * 0.3 : Math.random() * pH,
      r: 6 + Math.random() * 8,
      vy: 0.4 + Math.random() * 0.8,
      vx: -0.25 + Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      vr: -0.02 + Math.random() * 0.04,
      sway: Math.random() * Math.PI * 2,
      col,
      isLeaf,
      alpha: 0.45 + Math.random() * 0.35,
    };
  };

  const petalPath = (ctx, r) => {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.7, r * 0.7, 0, r);
    ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.9, -r * 0.6, 0, -r);
    ctx.fill();
  };

  const leafPath = (ctx, r) => {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.1, 0, r * 1.1);
    ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, 0, -r * 1.1);
    ctx.fill();
  };

  let pRaf = 0;
  const petalLoop = () => {
    pCtx.clearRect(0, 0, pW, pH);

    // 1. Falling petals and leaves
    for (const p of petals) {
      p.sway += 0.012;
      p.x += p.vx + Math.sin(p.sway) * 0.45;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > pH + 20) Object.assign(p, makePetal(true));

      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot);
      pCtx.fillStyle = rgba(p.col, p.alpha);
      if (p.isLeaf) leafPath(pCtx, p.r);
      else petalPath(pCtx, p.r);
      pCtx.restore();
    }

    // 2. Interactive planted blossoms (spawned by user taps)
    for (let i = plantedFlowers.length - 1; i >= 0; i--) {
      const f = plantedFlowers[i];
      f.scale += (f.targetScale - f.scale) * 0.14;
      f.rot += f.vr;
      f.y += f.vy;
      f.life -= f.decay;
      if (f.life <= 0) { plantedFlowers.splice(i, 1); continue; }

      pCtx.save();
      pCtx.translate(f.x, f.y);
      pCtx.rotate(f.rot);
      pCtx.scale(f.scale, f.scale);
      pCtx.globalAlpha = Math.min(1, f.life * 1.6);

      const nPetals = f.type === "daisy" ? 8 : 5;
      const petLen = f.size * 0.62;
      const petWid = petLen * 0.52;
      pCtx.fillStyle = rgba(f.col, 0.92);

      for (let p = 0; p < nPetals; p++) {
        pCtx.save();
        pCtx.rotate((p / nPetals) * Math.PI * 2);
        pCtx.beginPath();
        pCtx.moveTo(0, 0);
        pCtx.bezierCurveTo(petWid, -petLen * 0.4, petWid * 0.6, -petLen, 0, -petLen);
        pCtx.bezierCurveTo(-petWid * 0.6, -petLen, -petWid, -petLen * 0.4, 0, 0);
        pCtx.fill();
        pCtx.restore();
      }

      // Warm Amber pollen center
      pCtx.beginPath();
      pCtx.arc(0, 0, f.size * 0.24, 0, Math.PI * 2);
      pCtx.fillStyle = rgba(GOLD, 0.95);
      pCtx.fill();

      pCtx.restore();
    }

    // 3. Sparks & Confetti
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy += 0.12; s.vx *= 0.985;
      s.x += s.vx; s.y += s.vy; s.rot += s.vr; s.life -= 0.011;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }

      pCtx.save();
      pCtx.translate(s.x, s.y);
      pCtx.rotate(s.rot);
      pCtx.fillStyle = rgba(s.col, s.life);
      petalPath(pCtx, s.r);
      pCtx.restore();
    }

    pRaf = requestAnimationFrame(petalLoop);
  };

  const petalStart = () => { if (!pRaf && !document.hidden && !reduceMotion.matches) pRaf = requestAnimationFrame(petalLoop); };
  const petalStop = () => { cancelAnimationFrame(pRaf); pRaf = 0; };

  const burst = (x, y, count = 40, power = 5) => {
    if (reduceMotion.matches) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * power;
      const col = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
      sparks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        r: 4 + Math.random() * 7,
        rot: Math.random() * 6,
        vr: -0.2 + Math.random() * 0.4,
        life: 1,
        col,
      });
    }
    petalStart();
  };

  const plantFlower = (x, y) => {
    if (reduceMotion.matches) return;
    const types = ["daisy", "blossom", "rose", "mint"];
    const type = types[Math.floor(Math.random() * types.length)];
    const col = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    plantedFlowers.push({
      x, y,
      type,
      col,
      size: 18 + Math.random() * 14,
      scale: 0,
      targetScale: 1,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.015,
      vy: -0.22 - Math.random() * 0.35,
      life: 1,
      decay: 0.003,
    });
    burst(x, y, 14, 3);
  };

  // Interactive tap anywhere to plant flowers!
  window.addEventListener("click", (e) => {
    if (e.target.closest && (e.target.closest("button") || e.target.closest(".wish"))) return;
    plantFlower(e.clientX, e.clientY);
  });

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  /* =========================================================
     BLOOM (Rich Pastel Floral Bouquet)
     Multi-flower composition:
     - Stems and eucalyptus leaves in XANH LÁ PASTEL
     - Forget-me-nots in XANH DƯƠNG PASTEL
     - Daisies & Buttercups in VÀNG PASTEL
     - Grand centerpiece layered flower in vibrant pastel harmony
     ========================================================= */
  const bCanvas = document.getElementById("bloom");
  const bCtx = bCanvas.getContext("2d");
  let bSize = 0, bloomT = 0, seed = 0, time = 0, bRaf = 0;
  let tiltX = 0, tiltY = 0, tx = 0, ty = 0;
  const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  const sizeBloom = () => {
    bSize = bCanvas.getBoundingClientRect().width;
    if (!bSize) return;
    bCanvas.width = bSize * dpr; bCanvas.height = bSize * dpr;
    bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawBloom = (still) => {
    const s = bSize;
    if (!s) return;
    bCtx.clearRect(0, 0, s, s);

    const cx = s / 2 + tiltX * s * 0.03;
    const cy = s * 0.46 + tiltY * s * 0.03;
    const spin = still ? 0 : time * 0.00015 + tiltX * 0.12;
    const breathe = still ? 1 : 1 + Math.sin(time * 0.0018) * 0.018;
    const p = ease(bloomT);

    // 1. Soft Warm Ambient Pastel Halo
    const halo = bCtx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.48);
    halo.addColorStop(0, rgba(YELLOW, 0.20 * p));
    halo.addColorStop(0.35, rgba(BLUE, 0.14 * p));
    halo.addColorStop(0.7, rgba(GREEN, 0.08 * p));
    halo.addColorStop(1, "rgba(255, 255, 255, 0)");
    bCtx.fillStyle = halo;
    bCtx.fillRect(0, 0, s, s);

    // 2. Lá xanh pastel & cành thảo mộc (XANH LÁ PASTEL)
    bCtx.strokeStyle = rgba(GREEN, 0.75);
    bCtx.lineWidth = Math.max(3, s * 0.012);
    bCtx.lineCap = "round";
    bCtx.beginPath();
    bCtx.moveTo(cx, cy + s * 0.08);
    bCtx.quadraticCurveTo(cx + s * 0.08, cy + s * 0.32, cx - s * 0.02, s * 0.96);
    bCtx.stroke();

    const leafP = ease(Math.max(0, (bloomT - 0.05) / 0.8));
    if (leafP > 0) {
      const leafCount = 6;
      for (let i = 0; i < leafCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const ly = cy + s * 0.14 + (i * 0.1) * s * 0.6;
        const lx = cx + side * s * 0.03;
        const lAngle = (side * 0.65) + Math.sin(time * 0.001 + i) * 0.05;
        const lLen = s * 0.18 * leafP;
        const lWid = lLen * 0.42;

        bCtx.save();
        bCtx.translate(lx, ly);
        bCtx.rotate(lAngle);

        const lg = bCtx.createLinearGradient(0, 0, 0, -lLen);
        lg.addColorStop(0, rgba(GREEN, 0.85));
        lg.addColorStop(1, rgba([167, 243, 208], 0.6));
        bCtx.fillStyle = lg;
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.quadraticCurveTo(lWid, -lLen * 0.45, 0, -lLen);
        bCtx.quadraticCurveTo(-lWid, -lLen * 0.45, 0, 0);
        bCtx.fill();

        bCtx.strokeStyle = rgba([240, 253, 244], 0.75);
        bCtx.lineWidth = 1.5;
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.lineTo(0, -lLen * 0.8);
        bCtx.stroke();

        bCtx.restore();
      }
    }

    // 3. Chùm hoa xanh dương pastel (XANH DƯƠNG)
    const blueP = ease(Math.max(0, (bloomT - 0.12) / 0.78));
    if (blueP > 0) {
      const blueClusters = [
        { x: cx - s * 0.28, y: cy - s * 0.14, rot: -0.4, scale: 0.9 },
        { x: cx + s * 0.26, y: cy - s * 0.18, rot: 0.35, scale: 0.8 },
        { x: cx - s * 0.16, y: cy - s * 0.30, rot: -0.2, scale: 0.7 },
      ];
      for (const cl of blueClusters) {
        bCtx.save();
        bCtx.translate(cl.x, cl.y);
        bCtx.rotate(cl.rot + spin * 0.4);
        const bRad = s * 0.065 * blueP * cl.scale * breathe;

        for (let pIdx = 0; pIdx < 5; pIdx++) {
          bCtx.save();
          bCtx.rotate((pIdx / 5) * Math.PI * 2);
          const bg = bCtx.createRadialGradient(0, -bRad * 0.7, 0, 0, -bRad * 0.7, bRad * 0.7);
          bg.addColorStop(0, rgba(WHITE, 0.95));
          bg.addColorStop(0.4, rgba(BLUE, 0.9));
          bg.addColorStop(1, rgba([56, 189, 248], 0.75));
          bCtx.fillStyle = bg;
          bCtx.beginPath();
          bCtx.arc(0, -bRad * 0.7, bRad * 0.52, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        }

        bCtx.beginPath();
        bCtx.arc(0, 0, bRad * 0.25, 0, Math.PI * 2);
        bCtx.fillStyle = rgba(WHITE, 0.95);
        bCtx.fill();
        bCtx.restore();
      }
    }

    // 4. Hoa cúc vàng nắng pastel (VÀNG PASTEL)
    const yellowP = ease(Math.max(0, (bloomT - 0.2) / 0.7));
    if (yellowP > 0) {
      const yellowBlossoms = [
        { x: cx + s * 0.28, y: cy + s * 0.08, rot: 0.5, scale: 0.92 },
        { x: cx - s * 0.26, y: cy + s * 0.14, rot: -0.55, scale: 0.82 },
        { x: cx + s * 0.14, y: cy - s * 0.28, rot: 0.25, scale: 0.72 },
      ];
      for (const yb of yellowBlossoms) {
        bCtx.save();
        bCtx.translate(yb.x, yb.y);
        bCtx.rotate(yb.rot - spin * 0.35);
        const yRad = s * 0.082 * yellowP * yb.scale * breathe;
        const petCount = 8;
        for (let pIdx = 0; pIdx < petCount; pIdx++) {
          bCtx.save();
          bCtx.rotate((pIdx / petCount) * Math.PI * 2);
          const yg = bCtx.createLinearGradient(0, 0, 0, -yRad);
          yg.addColorStop(0, rgba(YELLOW, 0.95));
          yg.addColorStop(1, rgba([254, 240, 138], 0.7));
          bCtx.fillStyle = yg;
          bCtx.beginPath();
          bCtx.ellipse(0, -yRad * 0.55, yRad * 0.25, yRad * 0.55, 0, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        }

        bCtx.beginPath();
        bCtx.arc(0, 0, yRad * 0.32, 0, Math.PI * 2);
        const coreG = bCtx.createRadialGradient(0, 0, 0, 0, 0, yRad * 0.32);
        coreG.addColorStop(0, rgba([254, 240, 138], 1));
        coreG.addColorStop(1, rgba(GOLD, 0.95));
        bCtx.fillStyle = coreG;
        bCtx.fill();
        bCtx.restore();
      }
    }

    // 5. Đóa hoa trung tâm đa sắc màu rực rỡ
    const centerTiers = [
      // Lớp 1: Cánh hoa xanh dương & lavender (8 cánh)
      { n: 8, len: 0.38, wid: 0.48, col: BLUE, a: 0.82, delay: 0.05, off: 0 },
      // Lớp 2: Cánh hoa vàng nắng ấm áp (8 cánh)
      { n: 8, len: 0.32, wid: 0.52, col: YELLOW, a: 0.88, delay: 0.16, off: Math.PI / 8 },
      // Lớp 3: Cánh hoa xanh lá mint dịu mát (6 cánh)
      { n: 6, len: 0.25, wid: 0.58, col: GREEN, a: 0.90, delay: 0.28, off: Math.PI / 6 },
      // Lớp 4: Cánh hoa hồng phấn ngọt ngào (5 cánh)
      { n: 5, len: 0.18, wid: 0.65, col: PINK, a: 0.95, delay: 0.40, off: Math.PI / 5 },
    ];

    for (const L of centerTiers) {
      const cp = still ? 1 : ease((bloomT - L.delay) / (1 - L.delay));
      if (cp <= 0) continue;
      const len = s * L.len * cp * breathe;
      const wid = len * L.wid;
      for (let i = 0; i < L.n; i++) {
        bCtx.save();
        bCtx.translate(cx, cy);
        bCtx.rotate(L.off + spin + (i / L.n) * Math.PI * 2);
        const g = bCtx.createLinearGradient(0, 0, 0, -len);
        g.addColorStop(0, rgba(L.col, L.a));
        g.addColorStop(0.7, rgba(mix(L.col, WHITE, 0.35), L.a * 0.9));
        g.addColorStop(1, rgba(WHITE, L.a * 0.4));
        bCtx.fillStyle = g;
        bCtx.shadowColor = rgba(L.col, 0.4);
        bCtx.shadowBlur = 10;
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.bezierCurveTo(wid, -len * 0.35, wid * 0.7, -len * 0.95, 0, -len);
        bCtx.bezierCurveTo(-wid * 0.7, -len * 0.95, -wid, -len * 0.35, 0, 0);
        bCtx.fill();
        bCtx.restore();
      }
    }

    // Nhụy hoa trung tâm với phấn hoa vàng ánh kim
    const coreP = still ? 1 : ease((bloomT - 0.5) / 0.5);
    if (coreP > 0) {
      bCtx.shadowBlur = 0;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + spin * 1.8;
        const rr = s * 0.048 * coreP;
        bCtx.beginPath();
        bCtx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s * 0.007, 0, Math.PI * 2);
        bCtx.fillStyle = rgba(YELLOW, 0.95);
        bCtx.fill();
      }
      const centerBall = bCtx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.038 * coreP);
      centerBall.addColorStop(0, rgba(WHITE, 1));
      centerBall.addColorStop(0.5, rgba(YELLOW, 0.95));
      centerBall.addColorStop(1, rgba(GOLD, 0.9));
      bCtx.beginPath();
      bCtx.arc(cx, cy, s * 0.035 * coreP, 0, Math.PI * 2);
      bCtx.fillStyle = centerBall;
      bCtx.fill();
    }
  };

  const bloomLoop = (ts) => {
    time = ts;
    if (bloomT < 1) bloomT = Math.min(1, bloomT + 0.008);
    tiltX += (tx - tiltX) * 0.06;
    tiltY += (ty - tiltY) * 0.06;
    drawBloom(false);
    bRaf = requestAnimationFrame(bloomLoop);
  };

  const bloomStart = () => {
    if (reduceMotion.matches) { bloomT = 1; drawBloom(true); return; }
    if (!bRaf && !document.hidden) bRaf = requestAnimationFrame(bloomLoop);
  };
  const bloomStop = () => { cancelAnimationFrame(bRaf); bRaf = 0; };

  const rebloom = (x, y) => {
    seed++;
    if (reduceMotion.matches) { drawBloom(true); return; }
    bloomT = 0;
    burst(x, y, 60, 6.5);
  };

  bCanvas.addEventListener("click", (e) => rebloom(e.clientX, e.clientY));
  bCanvas.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const [x, y] = centerOf(bCanvas);
      rebloom(x, y);
    }
  });

  bCanvas.addEventListener("pointermove", (e) => {
    const r = bCanvas.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  bCanvas.addEventListener("pointerleave", () => { tx = 0; ty = 0; });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { sizeBloom(); if (!bRaf) drawBloom(true); }).observe(bCanvas);
  }

  /* ---------- money ticker ---------- */
  const tickerWords = ["dày", "rủng rỉnh", "dư dả", "ting ting"];
  const ticker = document.getElementById("ticker");
  if (!reduceMotion.matches) {
    let t = 0;
    setInterval(() => {
      if (scene.hidden) return;
      t = (t + 1) % tickerWords.length;
      ticker.textContent = tickerWords[t];
      ticker.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(0.16,1,0.3,1)" });
    }, 2200);
  }

  /* =========================================================
     FLOW: gift box -> open -> pastel floral garden + wishes
     ========================================================= */
  scene.querySelectorAll(".pop").forEach((el, i) => el.style.setProperty("--i", i + 2));

  let busy = false;
  const openGift = async () => {
    if (busy) return;
    busy = true;
    openBtn.disabled = true;
    playMusic();

    gift.classList.add("is-open");
    await wait(260);
    const [gx, gy] = centerOf(gift);
    burst(gx, gy - 40, 110, 8.5);
    await wait(900);

    order.classList.add("is-leaving");
    await wait(700);
    order.hidden = true;

    scene.hidden = false;
    sizeBloom();
    void scene.offsetWidth;
    scene.classList.add("is-in");
    bloomT = 0;
    bloomStart();
    const [bx, by] = centerOf(bCanvas);
    burst(bx, by, 80, 7.5);
    bCanvas.focus({ preventScroll: true });
    busy = false;
  };

  const replay = () => {
    bloomStop();
    scene.classList.remove("is-in");
    scene.hidden = true;
    gift.classList.remove("is-open");
    order.hidden = false;
    void order.offsetWidth;
    order.classList.remove("is-leaving");
    openBtn.disabled = false;
    openBtn.focus();
  };

  gift.addEventListener("click", openGift);
  openBtn.addEventListener("click", openGift);
  replayBtn.addEventListener("click", replay);

  /* ---------- lifecycle ---------- */
  window.addEventListener("resize", sizePetals);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { petalStop(); bloomStop(); }
    else { petalStart(); if (!scene.hidden) bloomStart(); }
  });

  sizePetals();
  if (!reduceMotion.matches) {
    const count = pW < 640 ? 16 : 28;
    for (let i = 0; i < count; i++) petals.push(makePetal(false));
    petalStart();
  }
  setTimeout(() => openBtn.focus({ preventScroll: true }), 50);
})();
