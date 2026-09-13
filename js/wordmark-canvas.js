/**
 * ZYNTIS GROUP — Interactive Footer Wordmark Particle Dispersal
 * Flat 2D grid of voxels/particles that disperse like digital ether near the cursor
 */
(function () {
  const cv = document.getElementById('ft-vox');
  const footer = document.getElementById('footer');
  if (!cv || !footer || !cv.getContext) return;

  const ctx = cv.getContext('2d');
  const GW = 360, GH = 55;
  let cells = [], W = 0, H = 0, cell = 1, originX = 0, originY = 0;

  // Offscreen canvas to render typography and sample particle coordinates
  function buildWordmarkGrid() {
    const off = document.createElement('canvas');
    off.width = GW;
    off.height = GH;
    const o = off.getContext('2d');

    o.fillStyle = '#000000';
    o.fillRect(0, 0, GW, GH);

    // Draw high-contrast text to sample
    o.font = '900 27px "Inter", sans-serif';
    o.fillStyle = '#ffffff';
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.letterSpacing = '0.10em';
    o.fillText('ZYNTIS GROUP', GW / 2, GH / 2);

    const d = o.getImageData(0, 0, GW, GH).data;
    cells = [];
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const idx = (y * GW + x) * 4;
        if (d[idx] > 120) {
          const rand = Math.random();
          let tier = 0; // 0 = Sovereign Gold, 1 = Champagne, 2 = Bronze, 3 = White Energy
          if (rand < 0.05) tier = 3;       // 5% subtle white energy accents
          else if (rand < 0.32) tier = 1;  // 27% champagne highlight
          else if (rand < 0.42) tier = 2;  // 10% deeper bronze crevice tone
          else tier = 0;                   // 58% rich sovereign gold

          cells.push({
            x,
            y,
            dx: 0,
            dy: 0,
            tier,
            seed: Math.random()
          });
        }
      }
    }
    resize();
    loop();
  }

  let tmx = -9999, tmy = -9999, mx = -9999, my = -9999;
  window.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    tmx = (e.clientX - r.left) * (W / r.width);
    tmy = (e.clientY - r.top) * (H / r.height);
  });

  function resize() {
    const par = cv.parentNode;
    const lw = par.clientWidth;
    const lh = par.clientHeight;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h || !lw) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(w * dpr);
    H = Math.round(h * dpr);
    cv.width = W;
    cv.height = H;

    cell = Math.min(lw * dpr / GW, lh * dpr / GH);
    originX = (W - GW * cell) / 2;
    originY = (H - GH * cell) / 2;
  }

  window.addEventListener('resize', resize);

  let vis = false;
  new IntersectionObserver(es => {
    vis = es[0].isIntersecting;
    if (vis) resize();
  }, { rootMargin: '160px' }).observe(footer);

  const GOLD = '#c8a44e';
  const CHAMPAGNE = '#dfc070';
  const BRONZE = '#9a7828';
  const WHITE = '#ffffff';

  const t0 = performance.now();
  function loop() {
    requestAnimationFrame(loop);
    if (!vis || !cells.length || !W) return;

    const t = (performance.now() - t0) / 1000;
    if (mx < -9000) {
      mx = tmx;
      my = tmy;
    } else {
      mx += (tmx - mx) * 0.1;
      my += (tmy - my) * 0.1;
    }

    const LW = GW * cell;
    const R = LW * 0.28;

    ctx.clearRect(0, 0, W, H);
    const base = cell * 0.82;

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const bx = originX + c.x * cell + cell * 0.5;
      const by = originY + c.y * cell + cell * 0.5;

      const vx = bx - mx;
      const vy = by - my;
      const d = Math.hypot(vx, vy) || 0.0001;
      const env = Math.max(0, 1 - d / R);
      const ev = env * env;

      const p = c.seed * 6.283;
      const fl = ev * LW * 0.018;
      const driftX = fl * Math.sin(t * 0.9 + (c.x / GW) * 28 + p);
      const driftY = fl * Math.cos(t * 0.8 + (c.y / GH) * 6.4 + p);
      const push = ev * LW * 0.045;

      const tx = (vx / d) * push + driftX;
      const ty = (vy / d) * push + driftY - ev * LW * 0.016;

      c.dx += (tx - c.dx) * 0.07;
      c.dy += (ty - c.dy) * 0.07;

      const s = base * (1 - ev * 0.45);

      // Metallic Gold System with shimmering white electric sparks
      let col = GOLD;
      if (c.tier === 3) {
        // Intermittent white shimmer
        const shimmer = Math.sin(t * 10.0 + c.seed * 30.0);
        col = shimmer > 0.3 ? WHITE : CHAMPAGNE;
      } else if (c.tier === 1) {
        col = CHAMPAGNE;
      } else if (c.tier === 2) {
        col = BRONZE;
      }

      ctx.fillStyle = col;
      ctx.fillRect(bx + c.dx - s * 0.5, by + c.dy - s * 0.5, s, s);
    }
  }

  // Build grid once fonts are active
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(buildWordmarkGrid);
  } else {
    setTimeout(buildWordmarkGrid, 200);
  }
})();
