/**
 * ZYNTIS GROUP — Interactive Dithered Systems Tiles
 * Canvas particle field with cursor repulsion, vortex swirl physics, and gold accents
 */
(function () {
  const tiles = Array.prototype.slice.call(document.querySelectorAll('canvas.sy-tile'));
  if (!tiles.length) return;

  const CAN_HOVER = matchMedia('(hover: hover)').matches;
  const DOT = 'rgba(200, 164, 78, 0.36)';
  const DOT_GOLD = '#c8a44e';
  const DOT_BRIGHT = '#dfc070';
  const R = 0.28;
  const STR = 0.16;
  const EASE = 0.16;
  const SWIRL = 0.85;
  const TSPEED = 0.008;
  const M = 0.206;
  const SP = 1 - 2 * M; // Center 58.8% reserved so repelled dots never clip

  function loadTile(cv) {
    fetch(cv.dataset.src)
      .then(r => r.text())
      .then(txt => {
        const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return;
        const vb = (svg.getAttribute('viewBox') || '0 0 600 600').split(/\s+/).map(Number);
        const ox = vb[0], oy = vb[1], vw = vb[2], vh = vb[3];
        const rr = Array.prototype.slice.call(doc.querySelectorAll('rect'));
        if (!rr.length) return;

        const sN = parseFloat(rr[0].getAttribute('width')) / vw;
        const dots = rr.map((r, idx) => {
          const x = (parseFloat(r.getAttribute('x')) - ox + parseFloat(r.getAttribute('width')) / 2) / vw;
          const y = (parseFloat(r.getAttribute('y')) - oy + parseFloat(r.getAttribute('height')) / 2) / vh;
          return {
            hx: x,
            hy: y,
            x: x,
            y: y,
            isGoldAccent: (idx % 14 === 0)
          };
        });
        run(cv, dots, sN, vw / vh);
      })
      .catch(err => console.warn('Could not load tile SVG', cv.dataset.src, err));
  }

  // Defer heavy SVG loading until near viewport
  if ('IntersectionObserver' in window) {
    const tio = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          tio.unobserve(e.target);
          loadTile(e.target);
        }
      });
    }, { rootMargin: '500px' });
    tiles.forEach(cv => tio.observe(cv));
  } else {
    tiles.forEach(loadTile);
  }

  function run(cv, dots, sN, aspect) {
    const ctx = cv.getContext('2d');
    const rot = (parseFloat(cv.dataset.rot) || 0) * Math.PI / 180;
    let W = 0, H = 0, DPR = 1, mx = -99, my = -99, hover = false, raf = 0, T = 0;

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      const sw = cv.parentNode.offsetWidth;
      W = sw * 1.7;
      H = W / aspect;
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      cv.style.left = (-0.206 * W) + 'px';
      cv.style.top = (-0.206 * H) + 'px';
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
    }

    function draw() {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const sz = Math.max(1, sN * SP * W);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const px = (M + d.x * SP) * W - sz / 2;
        const py = (M + d.y * SP) * H - sz / 2;

        ctx.fillStyle = d.isGoldAccent ? DOT_BRIGHT : (i % 5 === 0 ? DOT_GOLD : DOT);
        ctx.fillRect(px, py, sz, sz);
      }
    }

    function step() {
      T += TSPEED;
      let moving = false;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        let tx = d.hx;
        let ty = d.hy;

        if (hover) {
          const dx = d.hx - mx;
          const dy = d.hy - my;
          const dist = Math.hypot(dx, dy);

          if (dist < R && dist > 1e-4) {
            const t = dist / R;
            const fall = (1 - t) * (1 - t);
            const mag = STR * fall;
            const ang = Math.atan2(dy, dx) + SWIRL * fall + T;
            tx = d.hx + Math.cos(ang) * mag;
            ty = d.hy + Math.sin(ang) * mag;
          }
        }

        d.x += (tx - d.x) * EASE;
        d.y += (ty - d.y) * EASE;

        if (Math.abs(tx - d.x) > 4e-4 || Math.abs(ty - d.y) > 4e-4) {
          moving = true;
        }
      }

      draw();
      raf = (moving || hover) ? requestAnimationFrame(step) : 0;
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(step);
    }

    const slot = cv.parentNode;
    function local(e) {
      const r = slot.getBoundingClientRect();
      const cx = e.clientX - (r.left + r.width / 2);
      const cy = e.clientY - (r.top + r.height / 2);
      const c = Math.cos(-rot);
      const s = Math.sin(-rot);
      mx = 0.5 + (cx * c - cy * s) / slot.offsetWidth;
      my = 0.5 + (cx * s + cy * c) / slot.offsetHeight;
    }

    if (CAN_HOVER) {
      slot.addEventListener('pointerenter', e => { hover = true; local(e); kick(); });
      slot.addEventListener('pointermove', e => { hover = true; local(e); kick(); });
      slot.addEventListener('pointerleave', () => { hover = false; kick(); });
    }

    size();
    draw();

    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        size();
        if (!raf) draw();
      }, 150);
    });
  }
})();
