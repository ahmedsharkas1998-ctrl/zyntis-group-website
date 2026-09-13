/**
 * ZYNTIS GROUP — Animated 15x15 Pixel-Grammar Capability Icons
 * Visualizes core business capabilities through semantic system metaphors:
 * 01: AI Strategy & Agents — Central intelligence orchestrating multiple specialized agents
 * 02: Automation & Workflows — Sequential 5-stage automated pipeline (Trigger -> Processing -> Decision -> Action -> Outcome)
 * 03: AI Websites & Lead Systems — Inbound traffic filtered/qualified into structured CRM & calendar records
 * 04: Custom Software & SaaS — Disparate systems syncing through a central middleware engine
 */
(function () {
  const canvases = Array.prototype.slice.call(document.querySelectorAll('.cap-canvas'));
  if (!canvases.length) return;

  const N = 15;
  const SIZE = 160;

  // Luxury Black & Gold Color Grammar on Dark Cards
  const DIM = 'rgba(200, 164, 78, 0.22)';    // Subtle bronze-gold structure / inactive channels
  const GOLD = '#c8a44e';                    // Sovereign gold active nodes
  const GOLD_BRIGHT = '#dfc070';             // Champagne luminous data packets
  const WHITE = '#ffffff';                   // Brilliant electrical execution / verified confirmation

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const hash = (x, y) => {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  };

  const ICONS = {
    // -------------------------------------------------------------------------
    // 01: AI Strategy & Agents
    // Central intelligence orchestrating multiple specialized agents working together
    // -------------------------------------------------------------------------
    f01(x, y, t) {
      const T = 3.6;
      const ph = (t % T) / T; // 0.0 -> 1.0

      const cx = 7, cy = 7;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      // Central Core Intelligence (3x3 at center)
      if (dx <= 1 && dy <= 1) {
        if (dx === 0 && dy === 0) {
          // Central brain pulse
          return (ph < 0.25 || ph > 0.85) ? 3 : 2;
        }
        return 2;
      }

      // 4 Specialized Satellite Agents
      // Top Agent (Strategic Planner): (6..8, 1..2)
      const isTopAgent = (x >= 6 && x <= 8 && y >= 1 && y <= 2);
      // Right Agent (Data Analyst): (12..13, 6..8)
      const isRightAgent = (x >= 12 && x <= 13 && y >= 6 && y <= 8);
      // Bottom Agent (Workflow Operator): (6..8, 12..13)
      const isBottomAgent = (x >= 6 && x <= 8 && y >= 12 && y <= 13);
      // Left Agent (Conversational Engine): (1..2, 6..8)
      const isLeftAgent = (x >= 1 && x <= 2 && y >= 6 && y <= 8);

      // Working phase for agents (ph between 0.45 and 0.80)
      const agentsActive = ph >= 0.45 && ph <= 0.80;

      if (isTopAgent || isRightAgent || isBottomAgent || isLeftAgent) {
        if (agentsActive) {
          // High-energy cooperative execution
          return (hash(x, y + Math.floor(t * 8)) > 0.4) ? 3 : 2;
        }
        return 1; // Standby status
      }

      // Orchestration Bus Lines connecting Core to Agents
      const isTopBus = (x === 7 && y >= 3 && y <= 5);
      const isRightBus = (y === 7 && x >= 9 && x <= 11);
      const isBottomBus = (x === 7 && y >= 9 && y <= 11);
      const isLeftBus = (y === 7 && x >= 3 && x <= 5);

      // Outward command dispatch (ph: 0.22 -> 0.46)
      if (ph >= 0.22 && ph < 0.46) {
        const busProg = (ph - 0.22) / 0.24; // 0..1
        if (isTopBus && Math.abs((5 - y) / 2 - busProg) < 0.35) return 3;
        if (isRightBus && Math.abs((x - 9) / 2 - busProg) < 0.35) return 3;
        if (isBottomBus && Math.abs((y - 9) / 2 - busProg) < 0.35) return 3;
        if (isLeftBus && Math.abs((5 - x) / 2 - busProg) < 0.35) return 3;
      }

      // Inward return confirmation (ph: 0.78 -> 0.95)
      if (ph >= 0.78 && ph < 0.95) {
        const retProg = (ph - 0.78) / 0.17; // 0..1
        if (isTopBus && Math.abs((y - 3) / 2 - retProg) < 0.35) return 3;
        if (isRightBus && Math.abs((11 - x) / 2 - retProg) < 0.35) return 3;
        if (isBottomBus && Math.abs((11 - y) / 2 - retProg) < 0.35) return 3;
        if (isLeftBus && Math.abs((x - 3) / 2 - retProg) < 0.35) return 3;
      }

      // Steady bus conduits
      if (isTopBus || isRightBus || isBottomBus || isLeftBus) {
        return 1;
      }

      // Diagonal coordination links
      if ((dx === 3 && dy === 3) || (dx === 4 && dy === 4)) {
        return (hash(x, y + Math.floor(t * 3)) < 0.25 && agentsActive) ? 2 : 0;
      }

      return 0;
    },

    // -------------------------------------------------------------------------
    // 02: Automation & Workflows
    // Sequential automated pipeline: Trigger -> Processing -> Decision -> Action -> Outcome
    // -------------------------------------------------------------------------
    f02(x, y, t) {
      const T = 3.4;
      const ph = (t % T) / T; // 0.0 -> 1.0
      const progX = ph * 14;  // Traveling pulse position along X

      // Stage 1: Trigger (x: 1..2, y: 6..8)
      const isTrigger = (x >= 1 && x <= 2 && y >= 6 && y <= 8);
      // Stage 2: Processing Engine (x: 4..5, y: 5..9)
      const isProcessing = (x >= 4 && x <= 5 && y >= 5 && y <= 9);
      // Stage 3: Decision Logic Diamond (center x: 7..8, diamond shape y: 4..10)
      const isDecision = (x === 7 || x === 8) && (y >= 4 && y <= 10);
      const isDiamondWing = ((x === 6 || x === 9) && (y >= 6 && y <= 8));
      // Stage 4: Action Execution (x: 10..11, y: 5..9)
      const isAction = (x >= 10 && x <= 11 && y >= 5 && y <= 9);
      // Stage 5: Outcome / Delivery (x: 13, y: 6..8)
      const isOutcome = (x === 13 && y >= 6 && y <= 8);

      // Main horizontal data conduit at y = 7
      const isConduit = (y === 7 && x >= 1 && x <= 13);
      // Parallel branch tracks around decision
      const isTopBranch = (y === 5 && x >= 7 && x <= 8);
      const isBottomBranch = (y === 9 && x >= 7 && x <= 8);

      // 1. Moving Packet along the pipeline
      if (Math.abs(x - progX) < 0.8 && (y === 7 || (x >= 7 && x <= 8 && (y === 5 || y === 9)))) {
        return 3; // White electrical pulse
      }

      // Stage Active Illuminations as packet passes
      if (isTrigger) {
        return (ph < 0.18) ? 3 : 2;
      }
      if (isProcessing) {
        if (ph >= 0.18 && ph < 0.40) {
          return ((x + y + Math.floor(t * 12)) % 2 === 0) ? 3 : 2;
        }
        return 1;
      }
      if (isDecision || isDiamondWing) {
        if (ph >= 0.38 && ph < 0.65) {
          return (y === 7) ? 3 : 2;
        }
        return 1;
      }
      if (isAction) {
        if (ph >= 0.62 && ph < 0.85) {
          return ((y + Math.floor(t * 14)) % 2 === 0) ? 3 : 2;
        }
        return 1;
      }
      if (isOutcome) {
        return (ph >= 0.82) ? 3 : (ph >= 0.70 ? 2 : 1);
      }

      if (isConduit || isTopBranch || isBottomBranch) {
        return 1;
      }

      return 0;
    },

    // -------------------------------------------------------------------------
    // 03: AI Websites & Lead Systems
    // Inbound traffic filtered/qualified into structured CRM & calendar records
    // -------------------------------------------------------------------------
    f03(x, y, t) {
      const T = 3.6;
      const ph = (t % T) / T;

      // 1. Top Inbound Traffic Stream (y: 1..3, scattered entry)
      if (y <= 3) {
        // Falling visitor packet
        const fallX = 4 + ((Math.floor(t / T) * 3) % 7);
        const fallY = 1 + ph * 5;
        if (Math.abs(y - fallY) < 0.7 && Math.abs(x - fallX) < 0.8) {
          return 2; // Inbound visitor mote
        }
        // Ambient traffic dots
        if (y === 1 && (x === 3 || x === 6 || x === 8 || x === 11)) return 1;
        if (y === 2 && (x === 4 || x === 7 || x === 10)) return (hash(x, Math.floor(t * 4)) > 0.5) ? 2 : 0;
        return 0;
      }

      // 2. AI Qualification Funnel Walls (y: 4..8)
      // Sloping from width 11 down to width 3
      const isFunnelLeft = (y === 4 && x === 3) || (y === 5 && x === 4) || (y === 6 && x === 5) || (y === 7 && x === 6) || (y === 8 && x === 6);
      const isFunnelRight = (y === 4 && x === 11) || (y === 5 && x === 10) || (y === 6 && x === 9) || (y === 7 && x === 8) || (y === 8 && x === 8);
      if (isFunnelLeft || isFunnelRight) {
        return 2; // Crisp golden funnel boundary
      }

      // Active AI Qualification Scan Beam at Neck (y: 7..8, x: 7)
      if (x === 7 && (y === 7 || y === 8)) {
        if (ph >= 0.35 && ph <= 0.60) {
          return 3; // White qualification scanner pulse
        }
        return 1;
      }

      // 3. Bottom Structured Database & Calendar Grid (y: 10..13)
      // CRM Card (left): x: 2..6, y: 10..13
      const isCrmBorder = (y === 10 || y === 13) && (x >= 2 && x <= 6) || (x === 2 || x === 6) && (y >= 10 && y <= 13);
      // Calendar Card (right): x: 8..12, y: 10..13
      const isCalBorder = (y === 10 || y === 13) && (x >= 8 && x <= 12) || (x === 8 || x === 12) && (y >= 10 && y <= 13);

      // Qualified lead slotting into records (ph: 0.60 -> 1.0)
      const isFilled = ph >= 0.62;

      if (isCrmBorder || isCalBorder) {
        return isFilled ? 2 : 1;
      }

      // Inner CRM data rows
      if (x >= 3 && x <= 5 && (y === 11 || y === 12)) {
        if (isFilled) {
          return (y === 11) ? 3 : 2; // Verified lead data record
        }
        return 0;
      }

      // Inner Calendar booked slot checkmark
      if (x >= 9 && x <= 11 && (y === 11 || y === 12)) {
        if (isFilled) {
          // Checkmark pattern: (9,12), (10,12), (11,11)
          if ((x === 9 && y === 12) || (x === 10 && y === 12) || (x === 11 && y === 11)) {
            return 3; // White booked checkmark
          }
          return 2;
        }
        return 0;
      }

      // Conduits from neck to bottom cards
      if (y === 9 && (x === 4 || x === 7 || x === 10)) {
        if (ph >= 0.52 && ph <= 0.68) return 3;
        return 1;
      }

      return 0;
    },

    // -------------------------------------------------------------------------
    // 04: Custom Software & Integrations
    // Disparate systems syncing through a central middleware engine
    // -------------------------------------------------------------------------
    f04(x, y, t) {
      const T = 3.5;
      const ph = (t % T) / T;

      // 4 Disparate Systems in corners:
      // Top-Left (ERP): x: 1..3, y: 1..3
      const isTL = (x >= 1 && x <= 3 && y >= 1 && y <= 3);
      // Top-Right (Custom App): x: 11..13, y: 1..3
      const isTR = (x >= 11 && x <= 13 && y >= 1 && y <= 3);
      // Bottom-Left (Database): x: 1..3, y: 11..13
      const isBL = (x >= 1 && x <= 3 && y >= 11 && y <= 13);
      // Bottom-Right (External API): x: 11..13, y: 11..13
      const isBR = (x >= 11 && x <= 13 && y >= 11 && y <= 13);

      // Central Middleware Engine / API Hub: 3x3 at center (6..8, 6..8)
      const isHub = (x >= 6 && x <= 8 && y >= 6 && y <= 8);

      // Central Hub processing & rotation
      if (isHub) {
        const isCenter = (x === 7 && y === 7);
        if (ph >= 0.40 && ph <= 0.75) {
          // Normalizing & routing data
          return isCenter ? 3 : (((x + y + Math.floor(t * 10)) % 2 === 0) ? 3 : 2);
        }
        return isCenter ? 2 : 1;
      }

      // Diagonal Conduits
      const isTLConduit = (x === y && x >= 4 && x <= 5);
      const isTRConduit = (x + y === 14 && x >= 9 && x <= 10);
      const isBLConduit = (x + y === 14 && x >= 4 && x <= 5);
      const isBRConduit = (x === y && x >= 9 && x <= 10);

      // Inbound Sync (ph: 0.15 -> 0.42): Corner packets travel into hub
      if (ph >= 0.15 && ph < 0.42) {
        const inProg = (ph - 0.15) / 0.27; // 0..1
        if (isTLConduit && Math.abs((x - 4) - inProg) < 0.5) return 3;
        if (isTRConduit && Math.abs((10 - x) - inProg) < 0.5) return 3;
        if (isBLConduit && Math.abs((x - 4) - inProg) < 0.5) return 3;
        if (isBRConduit && Math.abs((10 - x) - inProg) < 0.5) return 3;
      }

      // Outbound Normalized Sync (ph: 0.72 -> 0.95): Synchronized broadcast to all
      if (ph >= 0.72 && ph < 0.95) {
        const outProg = (ph - 0.72) / 0.23; // 0..1
        if (isTLConduit && Math.abs((5 - x) - outProg) < 0.5) return 3;
        if (isTRConduit && Math.abs((x - 9) - outProg) < 0.5) return 3;
        if (isBLConduit && Math.abs((5 - x) - outProg) < 0.5) return 3;
        if (isBRConduit && Math.abs((x - 9) - outProg) < 0.5) return 3;
      }

      if (isTLConduit || isTRConduit || isBLConduit || isBRConduit) {
        return 1;
      }

      // Corner systems behavior
      if (isTL || isTR || isBL || isBR) {
        const isBorder = (x === 1 || x === 3 || x === 11 || x === 13 || y === 1 || y === 3 || y === 11 || y === 13);
        if (isBorder) return 2;

        // Flash together upon synchronized broadcast completion
        if (ph >= 0.88) return 3;

        // Individual asynchronous heartbeat when waiting
        if (isTL) return (Math.sin(t * 6.0) > 0.2) ? 2 : 1;
        if (isTR) return (Math.sin(t * 4.5 + 1.2) > 0.2) ? 2 : 1;
        if (isBL) return (Math.sin(t * 5.2 + 2.4) > 0.2) ? 2 : 1;
        if (isBR) return (Math.sin(t * 3.8 + 3.6) > 0.2) ? 2 : 1;
      }

      return 0;
    }
  };

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctxs = canvases.map(cv => {
    cv.width = SIZE * dpr;
    cv.height = SIZE * dpr;
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    return c;
  });

  const cell = SIZE / N;
  const sq = cell * 0.78;
  const off = cell * 0.11;

  function draw(t) {
    for (let i = 0; i < canvases.length; i++) {
      const ctx = ctxs[i];
      const fnName = canvases[i].dataset.fn;
      const fn = ICONS[fnName];
      if (!fn) continue;

      ctx.clearRect(0, 0, SIZE, SIZE);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const v = fn(x, y, t);
          if (!v) continue;
          if (v === 3) ctx.fillStyle = WHITE;
          else if (v === 2) ctx.fillStyle = GOLD;
          else if (v === 1) ctx.fillStyle = DIM;
          else ctx.fillStyle = GOLD_BRIGHT;
          ctx.fillRect(x * cell + off, y * cell + off, sq, sq);
        }
      }
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(1.5);
    return;
  }

  let visible = true;
  const sec = document.getElementById('capabilities');
  if (sec && 'IntersectionObserver' in window) {
    visible = false;
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
    }, { rootMargin: '140px' }).observe(sec);
  }

  (function loop() {
    if (visible) draw(performance.now() / 1000);
    requestAnimationFrame(loop);
  })();
})();

