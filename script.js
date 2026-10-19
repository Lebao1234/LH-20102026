(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion.matches ? 0 : ms));

  // Diverse Pastel Colors matching the mockup:
  const YELLOW = [253, 224, 71];    // Vàng pastel tươi
  const BLUE = [125, 211, 252];      // Xanh dương pastel
  const GREEN = [134, 239, 172];     // Xanh lá pastel / mint
  const PINK = [244, 114, 182];      // Hồng phấn
  const LILAC = [196, 181, 253];     // Tím lavender
  const PEACH = [251, 146, 60];      // Cam đào
  const GOLD = [245, 158, 11];       // Nhụy vàng hổ phách

  const PASTEL_PALETTE = [BLUE, YELLOW, GREEN, PINK, LILAC, PEACH];

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  const order = document.getElementById("order");
  const gift = document.getElementById("gift");
  const openBtn = document.getElementById("openGift");
  const scene = document.getElementById("scene");
  const replayBtn = document.getElementById("replay");
  const bouquetWrapper = document.getElementById("bouquetWrapper");
  const bouquetImg = document.getElementById("bouquetImg");

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

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (musicBtn.dataset.state === "playing") {
      userPaused = true;
      song.pause();
    } else {
      userPaused = false;
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
     PETALS + SPARKS + CLICK-TO-PLANT BLOSSOMS
     ========================================================= */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pCanvas = document.getElementById("petals");
  const pCtx = pCanvas.getContext("2d");
  let pW = 0, pH = 0;
  const petals = [];
  const sparks = [];
  const plantedFlowers = [];

  const sizePetals = () => {
    pW = window.innerWidth;
    pH = window.innerHeight;
    pCanvas.width = pW * dpr;
    pCanvas.height = pH * dpr;
    pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const makePetal = (top) => {
    const isLeaf = Math.random() < 0.22;
    const col = isLeaf ? GREEN : PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    return {
      x: Math.random() * pW,
      y: top ? -20 - Math.random() * pH * 0.3 : Math.random() * pH,
      r: 6 + Math.random() * 8,
      vy: 0.4 + Math.random() * 0.75,
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
    ctx.moveTo(0, -r * 1.15);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.1, 0, r * 1.15);
    ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, 0, -r * 1.15);
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

    // 2. Interactive planted blossoms (spawned by user taps anywhere!)
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

  const petalStart = () => {
    if (!pRaf && !document.hidden && !reduceMotion.matches) {
      pRaf = requestAnimationFrame(petalLoop);
    }
  };
  const petalStop = () => {
    cancelAnimationFrame(pRaf);
    pRaf = 0;
  };

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

  // Interactive: Click anywhere on screen to plant/bloom flowers!
  window.addEventListener("click", (e) => {
    if (e.target.closest && (e.target.closest("button") || e.target.closest(".wish-pill") || e.target.closest("#bouquetWrapper"))) return;
    plantFlower(e.clientX, e.clientY);
  });

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  // Bouquet click interaction (bounce & bursts)
  if (bouquetWrapper) {
    bouquetWrapper.addEventListener("click", () => {
      const [bx, by] = centerOf(bouquetWrapper);
      burst(bx, by, 50, 6.5);
      if (bouquetImg) {
        bouquetImg.animate([
          { transform: "scale(1)" },
          { transform: "scale(1.15) rotate(3deg)" },
          { transform: "scale(0.95) rotate(-2deg)" },
          { transform: "scale(1)" }
        ], { duration: 550, easing: "cubic-bezier(0.16,1,0.3,1)" });
      }
    });
  }

  /* ---------- Money Ticker on Card 2 ---------- */
  const tickerWords = ["dày", "rủng rỉnh", "dư dả", "ting ting"];
  const ticker = document.getElementById("ticker");
  if (!reduceMotion.matches && ticker) {
    let t = 0;
    setInterval(() => {
      if (scene.hidden) return;
      t = (t + 1) % tickerWords.length;
      ticker.textContent = tickerWords[t];
      ticker.animate([
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "none" }
      ], { duration: 600, easing: "cubic-bezier(0.16,1,0.3,1)" });
    }, 2200);
  }

  /* =========================================================
     FLOW: 3D Gift Box -> Open -> Pastel Floral Bouquet
     ========================================================= */
  scene.querySelectorAll(".pop").forEach((el, i) => el.style.setProperty("--i", i + 1));

  let busy = false;
  const openGift = async () => {
    if (busy) return;
    busy = true;
    openBtn.disabled = true;
    playMusic();

    gift.classList.add("is-open");
    const [gx, gy] = centerOf(gift);
    burst(gx, gy, 90, 8);
    await wait(450);

    order.classList.add("is-leaving");
    await wait(600);
    order.hidden = true;

    scene.hidden = false;
    void scene.offsetWidth; // force reflow for smooth animation
    scene.classList.add("is-in");

    if (bouquetWrapper) {
      const [bx, by] = centerOf(bouquetWrapper);
      burst(bx, by, 70, 7);
    }
    busy = false;
  };

  const replay = () => {
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

  /* ---------- Lifecycle ---------- */
  window.addEventListener("resize", sizePetals);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) petalStop();
    else petalStart();
  });

  sizePetals();
  if (!reduceMotion.matches) {
    const count = pW < 640 ? 14 : 26;
    for (let i = 0; i < count; i++) petals.push(makePetal(false));
    petalStart();
  }
  setTimeout(() => openBtn.focus({ preventScroll: true }), 50);
})();
