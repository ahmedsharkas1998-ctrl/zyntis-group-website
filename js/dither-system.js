/**
 * ZYNTIS GROUP — Scroll-Developed Dithered Architecture Diagram
 * Living Ambient Particle Recruitment & Interconnected Infrastructure
 * 
 * Mechanism:
 * 1. Living Ambient Ether: A permanent field of subtle data/energy particles continuously drifts in the space.
 * 2. Gravitational Recruitment: As the user scrolls, particles already present in the environment feel an attraction
 *    force toward the center, curving and converging inward organically into the Central AI Orchestration Engine (p: 0.04 -> 0.28).
 * 3. Progressive Sphere Materialization: Surrounding system nodes (01 -> 06) progressively recruit particles from the ambient
 *    field in a smooth staggered sequence (p: 0.22 -> 0.96).
 * 4. Seamless Reverse Scroll: Bidirectional continuous mathematical trajectories allow the spheres to dissolve cleanly back
 *    into drifting ambient particles on upward scroll.
 * 5. Persistent Vitality: Ambient particles continue floating in the background even after full formation so the space never feels dead.
 * 6. Vertical Clearance: Geometrically balanced coordinate system and dynamic container containment to guarantee complete visibility
 *    below the fixed navbar across all screen sizes.
 */
(function () {
  const cv = document.getElementById('px-cv');
  const stage = document.querySelector('.px-stage');
  const scene = document.getElementById('system-architecture');
  if (!cv || !stage || !scene) return;

  const ctx = cv.getContext('2d');
  const W_NATIVE = 780;
  const H_NATIVE = 800;
  const ASPECT = H_NATIVE / W_NATIVE; // ~1.0256
  let W = W_NATIVE;
  let H = H_NATIVE;
  let DPR = 1;

  // Staggered node definitions (normalized coordinates 0.0 to 1.0)
  // Balanced vertically so all upper spheres clear the fixed header with ample breathing room
  const NODES = [
    {
      id: 'core',
      num: 'AI CORE',
      name: 'ORCHESTRATION ENGINE',
      x: 0.50, y: 0.490, r: 0.150,
      tStart: 0.04, tEnd: 0.28,
      type: 'core'
    },
    {
      id: 'inbound',
      num: '01',
      name: 'INBOUND CHANNELS',
      x: 0.18, y: 0.255, r: 0.092,
      tStart: 0.22, tEnd: 0.40,
      type: 'sub'
    },
    {
      id: 'agent',
      num: '02',
      name: 'CONVERSATIONAL AGENT',
      x: 0.50, y: 0.165, r: 0.100,
      tStart: 0.34, tEnd: 0.52,
      type: 'sub'
    },
    {
      id: 'qual',
      num: '03',
      name: 'LEAD QUALIFICATION',
      x: 0.82, y: 0.255, r: 0.092,
      tStart: 0.46, tEnd: 0.64,
      type: 'sub'
    },
    {
      id: 'crm',
      num: '04',
      name: 'REAL-TIME CRM SYNC',
      x: 0.84, y: 0.725, r: 0.092,
      tStart: 0.58, tEnd: 0.76,
      type: 'sub'
    },
    {
      id: 'calendar',
      num: '05',
      name: 'AUTONOMOUS CALENDAR',
      x: 0.50, y: 0.815, r: 0.100,
      tStart: 0.70, tEnd: 0.88,
      type: 'sub'
    },
    {
      id: 'actions',
      num: '06',
      name: 'AUTOMATION & DISPATCH',
      x: 0.16, y: 0.725, r: 0.092,
      tStart: 0.80, tEnd: 0.96,
      type: 'sub'
    }
  ];

  // Bus Connections between Architecture Nodes
  const PIPES = [
    { from: 'inbound', to: 'agent', tStart: 0.36, tEnd: 0.50 },
    { from: 'agent', to: 'qual', tStart: 0.48, tEnd: 0.62 },
    { from: 'inbound', to: 'core', tStart: 0.38, tEnd: 0.54 },
    { from: 'qual', to: 'core', tStart: 0.54, tEnd: 0.68 },
    { from: 'core', to: 'crm', tStart: 0.66, tEnd: 0.80 },
    { from: 'core', to: 'calendar', tStart: 0.74, tEnd: 0.88 },
    { from: 'core', to: 'actions', tStart: 0.82, tEnd: 0.96 },
    { from: 'crm', to: 'calendar', tStart: 0.76, tEnd: 0.90 },
    { from: 'calendar', to: 'actions', tStart: 0.86, tEnd: 0.98 }
  ];

  // Deterministic pseudo-random generator for consistent reproducible seed distributions
  function pseudoNoise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  // ---------------------------------------------------------------------------
  // 1. PERMANENT LIVING AMBIENT ETHER (Always drifting in background)
  // ---------------------------------------------------------------------------
  const AMBIENT_COUNT = 180;
  const AMBIENT_PARTICLES = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    // Natural organic radial cloud distribution centered in canvas space (no harsh box edges)
    const angle = pseudoNoise(i * 3.11, 1.73) * Math.PI * 2;
    const dist = Math.sqrt(pseudoNoise(i * 5.97, 4.31)) * 0.46;
    const baseX = 0.50 + Math.cos(angle) * dist;
    const baseY = 0.49 + (Math.sin(angle) * dist) / ASPECT;

    AMBIENT_PARTICLES.push({
      baseX, baseY,
      speed: 0.4 + pseudoNoise(i * 2.33, 8.19) * 0.8,
      driftRadius: 0.014 + pseudoNoise(i * 1.77, 9.21) * 0.022,
      phaseX: pseudoNoise(i * 8.71, 5.13) * Math.PI * 2,
      phaseY: pseudoNoise(i * 4.43, 3.87) * Math.PI * 2,
      twinkleSpeed: 1.3 + pseudoNoise(i * 6.31, 2.89) * 2.1,
      sizeMul: 0.70 + pseudoNoise(i * 7.73, 1.15) * 0.55,
      isChampagne: pseudoNoise(i * 9.17, 6.71) > 0.42
    });
  }

  // ---------------------------------------------------------------------------
  // 2. RECRUITED SYSTEM PARTICLES (Organic convergence from ambient ether into nodes)
  // ---------------------------------------------------------------------------
  const PARTICLES = [];
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad for Fibonacci phyllotaxis

  NODES.forEach((node, nIdx) => {
    const isCore = node.type === 'core';
    const count = isCore ? 460 : 200;

    for (let i = 0; i < count; i++) {
      const angle = i * GOLDEN_ANGLE;
      const radDist = Math.sqrt((i + 0.5) / count) * node.r;

      // Target position inside structured node
      const tx = node.x + Math.cos(angle) * radDist;
      const ty = node.y + (Math.sin(angle) * radDist) / ASPECT;

      // Natural environmental origin position (ambient field distribution)
      // Dispersed organically across the entire atmosphere before recruitment
      const envAngle = pseudoNoise(i * 7.13 + nIdx * 19.3, 3.71) * Math.PI * 2;
      const envDist = 0.12 + Math.sqrt(pseudoNoise(i * 3.37 + nIdx * 13.9, 8.23)) * 0.38;
      const ox = 0.50 + Math.cos(envAngle) * envDist + (pseudoNoise(i * 2.11, nIdx) - 0.5) * 0.06;
      const oy = 0.49 + (Math.sin(envAngle) * envDist) / ASPECT + (pseudoNoise(i * 5.73, nIdx) - 0.5) * 0.06;

      const isCenterCore = isCore && radDist < node.r * 0.38;
      const isRingBorder = Math.abs(radDist - node.r) < 0.014;

      PARTICLES.push({
        nodeId: node.id,
        tx, ty,
        ox, oy,
        tStart: node.tStart,
        tEnd: node.tEnd,
        isCore,
        isCenterCore,
        isRingBorder,
        swirl: (pseudoNoise(i * 2.1, nIdx) - 0.5) * 3.4,
        driftPhase: pseudoNoise(i, 7) * Math.PI * 2,
        seed: pseudoNoise(i, nIdx)
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 3. CONDUIT CONNECTION PARTICLES (Recruited into communication buses)
  // ---------------------------------------------------------------------------
  PIPES.forEach((pipe, pIdx) => {
    const n1 = NODES.find(n => n.id === pipe.from);
    const n2 = NODES.find(n => n.id === pipe.to);
    const pipePoints = 48;

    for (let i = 0; i <= pipePoints; i++) {
      const u = i / pipePoints;
      const tx = n1.x + (n2.x - n1.x) * u;
      const ty = n1.y + (n2.y - n1.y) * u;

      // Conduit particles also start naturally dispersed in the ambient field
      const envAngle = pseudoNoise(i * 11.3 + pIdx * 23.7, 5.81) * Math.PI * 2;
      const envDist = 0.10 + Math.sqrt(pseudoNoise(i * 4.91 + pIdx * 17.1, 9.43)) * 0.36;
      const ox = 0.50 + Math.cos(envAngle) * envDist;
      const oy = 0.49 + (Math.sin(envAngle) * envDist) / ASPECT;

      PARTICLES.push({
        pipeIdx: pIdx,
        tx, ty,
        ox, oy,
        tStart: pipe.tStart,
        tEnd: pipe.tEnd,
        isPipe: true,
        pipePos: u,
        swirl: (pseudoNoise(i, pIdx) - 0.5) * 2.2,
        driftPhase: pseudoNoise(i, pIdx * 3) * Math.PI * 2,
        seed: pseudoNoise(i, pIdx)
      });
    }
  });

  // Dynamic responsive canvas sizing with dual width & height boundary constraints
  function resize() {
    recalcSceneBounds();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const container = cv.parentNode;
    const cw = container.clientWidth || 580;
    const ch = container.clientHeight || 640;

    // Fit within both width and height bounds preserving aspect ratio
    let w = Math.min(cw, 680);
    let h = w * ASPECT;
    if (h > ch && ch > 200) {
      h = ch;
      w = h / ASPECT;
    }

    W = Math.round(w);
    H = Math.round(h);

    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
  }

  let sceneTop = 0;
  let sceneTotalDist = 1;
  function recalcSceneBounds() {
    sceneTop = scene.offsetTop;
    sceneTotalDist = Math.max(1, scene.offsetHeight - window.innerHeight);
  }

  function getScrollProgress() {
    const scrolled = window.scrollY - sceneTop;
    return Math.max(0, Math.min(1, scrolled / sceneTotalDist));
  }

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  let animTime = 0;
  let isVisible = false;
  let rafId = null;

  function render(time) {
    if (!isVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(render);
    animTime = time * 0.001;

    const progress = getScrollProgress();

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const DOT_DIM = 'rgba(200, 164, 78, 0.22)';
    const DOT_GOLD = '#c8a44e';
    const DOT_CHAMPAGNE = '#dfc070';
    const DOT_BRIGHT = '#ffffff';

    const baseSize = Math.max(2.0, W * 0.0060);

    // -------------------------------------------------------------------------
    // A. RENDER PERMANENT LIVING AMBIENT ETHER
    // Remains active at all times so the space is always alive and dynamic
    // -------------------------------------------------------------------------
    for (let i = 0; i < AMBIENT_PARTICLES.length; i++) {
      const ap = AMBIENT_PARTICLES[i];
      // Organic multi-harmonic drift
      const driftX = Math.sin(animTime * 0.42 * ap.speed + ap.phaseX) * ap.driftRadius;
      const driftY = Math.cos(animTime * 0.36 * ap.speed + ap.phaseY) * (ap.driftRadius / ASPECT);

      const ox = ap.baseX + driftX;
      const oy = ap.baseY + driftY;

      // Gentle inward gravitational deflection toward center as orchestration engine forms
      const toCoreX = 0.50 - ox;
      const toCoreY = 0.49 - oy;
      const gravity = Math.min(progress, 0.75) * 0.035;

      const px = (ox + toCoreX * gravity) * W;
      const py = (oy + toCoreY * gravity) * H;

      // Soft luxury luminance shimmer
      const shimmer = 0.5 + 0.5 * Math.sin(animTime * ap.twinkleSpeed + ap.phaseX);
      const alpha = 0.14 + shimmer * 0.26;
      const sz = baseSize * ap.sizeMul;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = ap.isChampagne ? DOT_CHAMPAGNE : DOT_GOLD;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1.0;

    // -------------------------------------------------------------------------
    // B. RENDER ACTIVE DATA BUS PIPES
    // Connecting conduits fade in and animate with traveling data packets
    // -------------------------------------------------------------------------
    for (let pIdx = 0; pIdx < PIPES.length; pIdx++) {
      const pipe = PIPES[pIdx];
      if (progress < pipe.tStart) continue;

      const alpha = Math.min(1, (progress - pipe.tStart) / (pipe.tEnd - pipe.tStart));
      const n1 = NODES.find(n => n.id === pipe.from);
      const n2 = NODES.find(n => n.id === pipe.to);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(200, 164, 78, ${0.28 * alpha})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 4]);
      ctx.moveTo(n1.x * W, n1.y * H);
      ctx.lineTo(n2.x * W, n2.y * H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Traveling White-Gold Data Packet along conduit
      if (alpha > 0.6) {
        const flowT = (animTime * 1.8 + pIdx * 0.4) % 1.0;
        const px = (n1.x + (n2.x - n1.x) * flowT) * W;
        const py = (n1.y + (n2.y - n1.y) * flowT) * H;
        ctx.fillStyle = DOT_BRIGHT;
        ctx.fillRect(px - baseSize * 0.7, py - baseSize * 0.7, baseSize * 1.4, baseSize * 1.4);
      }
    }

    // -------------------------------------------------------------------------
    // C. RENDER RECRUITED PARTICLES (Smooth Organic Convergence)
    // -------------------------------------------------------------------------
    for (let i = 0; i < PARTICLES.length; i++) {
      const p = PARTICLES[i];

      let curX, curY, alpha;

      if (progress <= p.tStart) {
        // STATE 1: Ambient Floating Field
        // Particles drift naturally in the environment before feeling recruitment attraction
        const drift = Math.sin(animTime * 1.1 + p.driftPhase) * 0.007;
        curX = p.ox + drift;
        curY = p.oy + drift / ASPECT;
        alpha = 0.18 + 0.08 * Math.sin(animTime * 1.8 + p.seed * 6.28);
      } else if (progress >= p.tEnd) {
        // STATE 3: Crystallized Architecture
        // Particles firmly settled into their designated Fibonacci lattice coordinates
        curX = p.tx;
        curY = p.ty;
        alpha = 1.0;
      } else {
        // STATE 2: Organic Gravitational Convergence
        // Particles feel gravitational pull, curving and spiraling inward into formation
        const u = (progress - p.tStart) / (p.tEnd - p.tStart);
        const f = easeOutCubic(u);

        // Curving swirl dynamics that gradually straighten as particles arrive
        const swirlAngle = (1 - f) * p.swirl;
        const cosS = Math.cos(swirlAngle);
        const sinS = Math.sin(swirlAngle);

        const dx = p.ox - p.tx;
        const dy = (p.oy - p.ty) * ASPECT;
        const rotDx = dx * cosS - dy * sinS;
        const rotDy = (dx * sinS + dy * cosS) / ASPECT;

        curX = p.tx + rotDx * (1 - f);
        curY = p.ty + rotDy * (1 - f);
        alpha = 0.20 + f * 0.80;
      }

      const px = curX * W;
      const py = curY * H;
      const sz = p.isCenterCore ? baseSize * 1.3 : baseSize;

      // Color Palette & Lightning Sparks
      let col = DOT_GOLD;
      if (p.isCenterCore) {
        // Active pulsing electrical core at the center of the AI engine
        const pulse = Math.sin(animTime * 4.5 + p.seed * 6.28);
        col = (pulse > 0.25) ? DOT_BRIGHT : DOT_CHAMPAGNE;
      } else if (p.isRingBorder) {
        col = DOT_CHAMPAGNE;
      } else if (alpha < 0.55) {
        col = DOT_DIM;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1.0;

    // -------------------------------------------------------------------------
    // D. RENDER NODE LABELS & HOLOGRAPHIC BLUEPRINT INDICATORS
    // -------------------------------------------------------------------------
    for (let nIdx = 0; nIdx < NODES.length; nIdx++) {
      const node = NODES[nIdx];
      if (progress < node.tStart) continue;

      const labelAlpha = Math.max(0, Math.min(1, (progress - node.tEnd + 0.05) / 0.12));
      if (labelAlpha < 0.02) continue;

      ctx.globalAlpha = labelAlpha;
      ctx.textAlign = 'center';

      const nx = node.x * W;
      const ny = (node.y + node.r + 0.026) * H;

      // Node Index / System Tag
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = node.type === 'core' ? DOT_CHAMPAGNE : DOT_GOLD;
      ctx.letterSpacing = '0.22em';
      ctx.fillText(node.num, nx, ny);

      // Node Architecture Name
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.fillStyle = '#f5f3ee';
      ctx.letterSpacing = '0.06em';
      ctx.fillText(node.name, nx, ny + 13);

      // Subtle Golden Holographic Ring for AI Core
      if (node.type === 'core') {
        ctx.beginPath();
        ctx.arc(node.x * W, node.y * H, node.r * W * 1.03, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 164, 78, ${0.32 * labelAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  function setVisible(vis) {
    isVisible = vis;
    if (isVisible) {
      recalcSceneBounds();
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('load', recalcSceneBounds);

  resize();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      setVisible(es[0].isIntersecting);
    }, { rootMargin: '240px' }).observe(scene);
  } else {
    setVisible(true);
  }
})();
