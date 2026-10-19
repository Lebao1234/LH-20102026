(() => {
  "use strict";

  /* =========================================================
     BD HỆ THỐNG: mỗi người trao một bông hoa, một lời chúc.
     Sửa tên, lời chúc, dòng ký tên ở đây. Lời chúc hiện là bản nháp.
     tone: viền thẻ "pink" | "lilac"; flower: "pink" | "gold" | "lilac" | "mint"
     ========================================================= */
  const TEAM = [
    {
      name: "Minh Hùm",
      role: "BD Hệ thống",
      tone: "pink",
      flower: "pink",
      meaning: "Rạng rỡ",
      wish: "Hùm chúc các chị em lúc nào cũng rạng rỡ như bông hoa to nhất trong bó: đi làm tự tin, về nhà nhẹ nhõm, chụp tấm ảnh nào cũng ưng. Việc gì khó cứ để BD Hệ thống gánh, các chị em chỉ việc tỏa sáng thôi.",
      sign: "Thương, Hùm",
    },
    {
      name: "Hòn Trợn",
      role: "BD Hệ thống",
      tone: "lilac",
      flower: "gold",
      meaning: "Tươi vui",
      wish: "Trợn chúc các chị em ngày nào cũng có chuyện để cười: trà sữa đúng vị, task vừa sức, họp xong sớm hơn dự kiến. Mong tiếng cười của mọi người cứ rộn ràng khắp văn phòng như hôm nay, để cả team đi làm cũng vui lây.",
      sign: "Thương, Trợn",
    },
    {
      name: "Tuấn Kẹc",
      role: "BD Hệ thống",
      tone: "pink",
      flower: "lilac",
      meaning: "Bình an",
      wish: "Kẹc chúc các chị em thật khỏe và thật bình an: ngủ đủ giấc, ăn đúng bữa, không phải thức khuya vì deadline. Dù công việc có lúc bận rộn, mong ai cũng giữ được những phút thảnh thơi cho riêng mình.",
      sign: "Thương, Kẹc",
    },
    {
      name: "Lê Bống",
      role: "BD Hệ thống",
      tone: "lilac",
      flower: "mint",
      meaning: "Hạnh phúc",
      wish: "Bống chúc các chị em thật nhiều hạnh phúc, ở nhà có người thương, ở công ty có đồng đội hiểu mình. Cảm ơn mọi người đã luôn dịu dàng và kiên nhẫn với BD Hệ thống. 20/10 vui hết mình nhé, và những ngày còn lại cũng vậy.",
      sign: "Thương, Bống",
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
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
    for (const s of stars) {
      s.t += dt * s.s;
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(s.t));
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
    for (const b of blades) {
      const sw = Math.sin(tm * 1.2 + b.ph + b.x * 0.004) * (4 + b.h * 0.12);
      ctx.strokeStyle = rgba(b.col, 0.55);
      ctx.lineWidth = b.w;
      ctx.beginPath();
      ctx.moveTo(b.x, H);
      ctx.quadraticCurveTo(b.x + sw * 0.3, H - b.h * 0.6, b.x + sw, H - b.h);
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

    drawStars(dt);
    drawGrass(now / 1000);

    // Meteors, rare
    meteorAcc += dt * 0.18;
    if (meteorAcc >= 1) {
      meteorAcc = 0;
      meteors.push({ x: W * (0.3 + Math.random() * 0.7), y: Math.random() * H * 0.35, vx: -(380 + Math.random() * 220), vy: 150 + Math.random() * 100, life: 1 });
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

    // Sparks
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy += 90 * dt; s.vx *= 0.985;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.8;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      ctx.fillStyle = rgba(s.col, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    raf = requestAnimationFrame(frame);
  };

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

  const burst = (x, y, count = 40, power = 220) => {
    if (reduceMotion.matches) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 6.283 + Math.random() * 0.2;
      const v = power * (0.4 + Math.random() * 0.6);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: pick(NEON) });
    }
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

  bouquet.addEventListener("click", () => {
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
  const story = document.querySelector(".story");
  const storyDots = [...story.querySelectorAll(".story__dot")];
  const scrollDriven = CSS.supports("animation-timeline: view()");

  const initials = (name) => {
    const parts = name.trim().split(/\s+/);
    const two = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return two.toUpperCase();
  };

  TEAM.forEach((m, i) => {
    const note = document.createElement("article");
    note.className = `note note--${m.tone === "lilac" ? "lilac" : "pink"}`;
    note.dataset.flower = m.flower;
    note.style.setProperty("--i", i);
    note.innerHTML = `
      <header class="note__head">
        <span class="note__avatar" aria-hidden="true"></span>
        <div><h3 class="note__name"></h3><p class="note__role"></p></div>
      </header>
      <p class="note__gift">
        <svg class="note__flower" viewBox="-26 -26 52 52" aria-hidden="true"><use href="#flw" /></svg>
        <span>trao bông</span> <strong></strong>
      </p>
      <p class="note__wish"></p>
      <p class="note__sign"><i class="ph-light ph-heart" aria-hidden="true"></i><span></span></p>`;
    note.querySelector(".note__avatar").textContent = initials(m.name);
    note.querySelector(".note__name").textContent = m.name;
    note.querySelector(".note__role").textContent = m.role;
    note.querySelector(".note__gift strong").textContent = m.meaning;
    note.querySelector(".note__wish").textContent = m.wish;
    note.querySelector(".note__sign span").textContent = m.sign;
    notesEl.append(note);

    const chip = document.createElement("span");
    chip.textContent = initials(m.name);
    paperTeam.append(chip);
  });

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
        const env = letter.querySelector(".envelope").getBoundingClientRect();
        burst(env.left + env.width / 2, env.top + env.height * 0.2, 44, 240);
      }
      if (!on) tornOnce = false;
    });
  }, midline);
  letter.querySelectorAll(".letter__mark").forEach((m) => stepIO.observe(m));

  // Photo finale: develop (fallback) + celebration
  let cheered = false;
  const photoIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const on = passed(en);
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
  photoIO.observe(photo.querySelector(".photo__mark"));

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
    openBtn.disabled = true;
    openBtn.setAttribute("aria-busy", "true");
    openLabel.textContent = "Đang mở...";
    playMusic();

    gift.classList.add("is-open");
    const [gx, gy] = centerOf(gift);
    burst(gx, gy, 90, 320);
    await wait(500);

    order.classList.add("is-leaving");
    await wait(700);
    order.hidden = true;

    stage2.hidden = false;
    void scene.offsetWidth;
    scene.classList.add("is-in");
    window.scrollTo({ top: 0, behavior: "instant" });

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
    window.scrollTo({ top: 0, behavior: "instant" });
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
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener("change", () => (reduceMotion.matches ? (stop(), drawStatic()) : start()));

  resize();
  const count = W < 640 ? 12 : 22;
  for (let i = 0; i < count; i++) petals.push(makePetal(false));
  start();
  setTimeout(() => openBtn.focus({ preventScroll: true }), 50);
})();
