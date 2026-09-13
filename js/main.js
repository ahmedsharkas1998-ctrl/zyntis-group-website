/**
 * ZYNTIS GROUP — Main Page Interactive Controller
 * - Lenis Smooth Momentum Scrolling
 * - Typewriter System with Gold Caret & Sequential Cascades
 * - IntersectionObserver Triggers & Chapter Transitions
 * - Side-Nav Rail & Mobile Menu
 * - Anchor Glides & Page Transitions
 */

(function () {
  'use strict';

  /* =========================================================================
     1. LENIS SMOOTH SCROLLING
     ========================================================================= */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.stop(); // Locked during preloader
    window.lenis = lenis;

    // Dedicated continuous requestAnimationFrame loop for Lenis
    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
  }

  // Anchor Links Glide via Lenis
  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', e => {
      let u;
      try { u = new URL(btn.href, location.href); } catch (_) { return; }
      if (u.pathname !== location.pathname) return;

      e.preventDefault();
      const targetId = btn.getAttribute('data-scroll');
      const el = document.getElementById(targetId);
      if (el && lenis) {
        lenis.scrollTo(el, { offset: -20 });
      }
    });
  });

  // Logo click -> smooth scroll to top
  const brandLogo = document.querySelector('.navbar .brand');
  if (brandLogo) {
    brandLogo.addEventListener('click', e => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0);
    });
  }

  // Keyboard navigation through Lenis
  window.addEventListener('keydown', e => {
    if (!lenis) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;

    const page = window.innerHeight * 0.88;
    let target = lenis.targetScroll;

    if (e.key === 'ArrowDown') target += 110;
    else if (e.key === 'ArrowUp') target -= 110;
    else if (e.key === 'PageDown' || e.key === ' ') target += page;
    else if (e.key === 'PageUp') target -= page;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = document.documentElement.scrollHeight;
    else return;

    e.preventDefault();
    lenis.scrollTo(target);
  });

  /* =========================================================================
     2. TYPEWRITER SYSTEM
     ========================================================================= */
  const CARET_SVG = '<svg viewBox="0 0 9 39" fill="currentColor"><rect x="0" y="0" width="4" height="4"/><rect x="5" y="5" width="4" height="4"/><rect x="0" y="10" width="4" height="4"/><rect x="5" y="15" width="4" height="4"/><rect x="0" y="20" width="4" height="4"/><rect x="5" y="25" width="4" height="4"/><rect x="0" y="30" width="4" height="4"/><rect x="5" y="35" width="4" height="4"/></svg>';

  function typewriter(scope, lines, delay = 250) {
    const tw = scope && scope.querySelector('.tw-text');
    if (!tw || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const caret = scope.querySelector('.zy-caret');
    tw.textContent = '';
    if (caret) caret.classList.add('tw-typing');

    let li = 0, ci = 0;
    const CH = 46;

    function done() {
      if (caret) caret.classList.remove('tw-typing');
    }

    function step() {
      if (li >= lines.length) { done(); return; }
      const line = lines[li];
      if (ci < line.length) {
        const c = line[ci++];
        tw.appendChild(document.createTextNode(c));
        setTimeout(step, CH + (c === ' ' ? 22 : 0));
      } else {
        li++; ci = 0;
        if (li < lines.length) {
          tw.appendChild(document.createElement('br'));
          setTimeout(step, CH * 4);
        } else {
          done();
        }
      }
    }
    setTimeout(step, delay);
  }

  // Hero headline typing trigger
  const heroScope = document.querySelector('[data-wp="0"] .chapter-copy');
  window.typeHero = function () {
    typewriter(heroScope, ['AI, Engineered Into', 'Your Business.'], 200);
  };

  // Chapter 1 (The Problem) pre-clear
  const ch1Scope = document.querySelector('[data-wp="1"] .chapter-copy');
  const ch1Lines = ['Your business runs on', 'disconnected systems.'];
  let ch1Typed = false;

  // Chapter 2 (Beliefs cascade)
  let beliefsTyped = false;
  function buildBeliefTypers() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    const items = Array.from(document.querySelectorAll('[data-wp="2"] .belief')).map(b => {
      const claim = b.querySelector('.b-claim');
      const text = b.querySelector('.b-text');
      const full = claim.textContent.trim();
      claim.textContent = '';

      const tw = document.createElement('span');
      tw.className = 'tw-text';
      const caret = document.createElement('span');
      caret.className = 'zy-caret';
      caret.innerHTML = CARET_SVG;
      caret.style.display = 'none';

      claim.append(tw, caret);
      if (text) {
        text.style.opacity = '0';
        text.style.transition = 'opacity 0.7s ease';
      }
      return { tw, caret, text, full };
    });
    return items;
  }
  const beliefTypers = buildBeliefTypers();

  function typeClaims(items, i = 0) {
    if (!items || i >= items.length) return;
    const { tw, caret, text, full } = items[i];
    caret.style.display = '';
    caret.classList.add('tw-typing');

    let ci = 0;
    const CH = 14;

    function step() {
      if (ci < full.length) {
        tw.appendChild(document.createTextNode(full[ci++]));
        setTimeout(step, CH);
      } else {
        caret.classList.remove('tw-typing');
        if (text) text.style.opacity = '1';
        if (i === items.length - 1) return;
        setTimeout(() => {
          caret.style.display = 'none';
          typeClaims(items, i + 1);
        }, 180);
      }
    }
    step();
  }

  // Section titles two-tone typewriter (Capabilities, Systems, Insights)
  function setupSectionTyper(scope) {
    const tw = scope && scope.querySelector('.tw-text');
    if (!tw || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const segs = [];
    tw.childNodes.forEach(node => {
      if (node.nodeName === 'BR') segs.push({ br: true });
      else if (node.nodeType === 1) segs.push({ text: node.textContent, cls: node.className });
      else if (node.nodeType === 3 && node.textContent.trim()) segs.push({ text: node.textContent, cls: '' });
    });

    let caret = scope.querySelector('.zy-caret');
    if (!caret) {
      caret = document.createElement('span');
      caret.className = 'zy-caret';
      caret.innerHTML = CARET_SVG;
      tw.after(caret);
    }

    tw.textContent = '';
    let typed = false;

    new IntersectionObserver((es, obs) => {
      if (es[0].isIntersecting && !typed) {
        typed = true;
        obs.disconnect();

        let si = 0, ci = 0, cur = null;
        function step() {
          if (si >= segs.length) {
            caret.classList.remove('tw-typing');
            return;
          }
          const seg = segs[si];
          if (seg.br) {
            tw.appendChild(document.createElement('br'));
            si++; ci = 0; cur = null;
            setTimeout(step, 90);
            return;
          }
          if (ci === 0) {
            cur = document.createElement('span');
            if (seg.cls) cur.className = seg.cls;
            tw.appendChild(cur);
          }
          if (ci < seg.text.length) {
            cur.appendChild(document.createTextNode(seg.text[ci++]));
            setTimeout(step, 40);
          } else {
            si++; ci = 0; cur = null;
            step();
          }
        }
        caret.classList.add('tw-typing');
        setTimeout(step, 160);
      }
    }, { threshold: 0.35 }).observe(scope);
  }

  ['.cap-title', '.sy-title', '.rs-title'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) setupSectionTyper(el);
  });

  /* =========================================================================
     3. INTERSECTION OBSERVERS
     ========================================================================= */
  // Chapter reveal observer
  const chapterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const copy = e.target.querySelector('.chapter-copy');
      if (!copy) return;
      copy.classList.toggle('in', e.isIntersecting);

      if (e.isIntersecting && e.target.dataset.wp === '1' && !ch1Typed) {
        ch1Typed = true;
        typewriter(ch1Scope, ch1Lines, 140);
      }
      if (e.isIntersecting && e.target.dataset.wp === '2' && !beliefsTyped) {
        beliefsTyped = true;
        setTimeout(() => typeClaims(beliefTypers, 0), 200);
      }
    });
  }, { threshold: 0.55 });
  document.querySelectorAll('.chapter').forEach(c => chapterIO.observe(c));

  // Light world systems section fade-in
  const systemsInner = document.querySelector('.systems-inner');
  if (systemsInner) {
    new IntersectionObserver(es => {
      es.forEach(en => en.target.classList.toggle('in', en.isIntersecting));
    }, { threshold: 0.2 }).observe(systemsInner);
  }

  // Scroll cue opacity
  const cue = document.getElementById('cue');
  window.addEventListener('scroll', () => {
    if (cue) cue.style.opacity = window.scrollY > window.innerHeight * 0.4 ? '0' : '1';
  }, { passive: true });

  /* =========================================================================
     4. SIDE-NAV & MOBILE MENU
     ========================================================================= */
  const links = {};
  document.querySelectorAll('.side-link').forEach(a => {
    links[a.getAttribute('href').slice(1)] = a;
  });

  if (Object.keys(links).length) {
    function setActive(id) {
      for (const k in links) {
        links[k].classList.toggle('active', k === id);
      }
    }
    const navIO = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });

    Object.keys(links).forEach(id => {
      const el = document.getElementById(id);
      if (el) navIO.observe(el);
    });

    const sideNav = document.querySelector('.side-nav');
    const footer = document.getElementById('footer');
    if (sideNav && footer) {
      new IntersectionObserver(es => {
        sideNav.classList.toggle('gone', es[0].isIntersecting);
      }, { rootMargin: '0px 0px -12% 0px' }).observe(footer);
    }
  }

  // Mobile Menu Toggle
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  if (navbar && navToggle) {
    navToggle.addEventListener('click', e => {
      e.stopPropagation();
      const open = navbar.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navbar.querySelectorAll('.nav-btn').forEach(b => {
      b.addEventListener('click', () => {
        navbar.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', e => {
      if (navbar.classList.contains('menu-open') && !navbar.contains(e.target)) {
        navbar.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* =========================================================================
     5. PAGE TRANSITIONS
     ========================================================================= */
  const tx = document.getElementById('px-tx');
  if (tx) {
    const p1 = tx.querySelector('.px-p1');
    const p2 = tx.querySelector('.px-p2');
    const EASE = 'cubic-bezier(.76,0,.24,1)';

    function slide(el, from, to, dur, delay) {
      return el.animate(
        [{ transform: `translateY(${from})` }, { transform: `translateY(${to})` }],
        { duration: dur, delay: delay || 0, easing: EASE, fill: 'forwards' }
      );
    }

    function exit(done) {
      tx.style.display = 'block';
      slide(p1, '100%', '0%', 520, 0);
      const a = slide(p2, '100%', '0%', 520, 90);
      const go = () => { if (done) { done(); done = null; } };
      if (a.finished) a.finished.then(go).catch(go);
      setTimeout(go, 820);
    }

    function enter() {
      tx.style.display = 'block';
      p1.style.transform = 'translateY(0%)';
      p2.style.transform = 'translateY(0%)';
      document.documentElement.classList.remove('px-cover');
      requestAnimationFrame(() => {
        slide(p2, '0%', '-100%', 560, 0);
        const a = slide(p1, '0%', '-100%', 560, 90);
        const fin = () => { tx.style.display = 'none'; };
        if (a.finished) a.finished.then(fin).catch(fin);
        setTimeout(fin, 920);
      });
    }

    if (document.documentElement.classList.contains('px-cover')) {
      requestAnimationFrame(enter);
    }
    sessionStorage.removeItem('pxnav');

    document.addEventListener('click', e => {
      if (e.defaultPrevented) return;
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      let url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      
      const norm = p => p.replace(/\/index\.html$/, '/');
      if (url.origin !== location.origin || norm(url.pathname) === norm(location.pathname)) return;

      e.preventDefault();
      sessionStorage.setItem('pxnav', '1');
      exit(() => { location.href = a.href; });
    });
  }
})();
