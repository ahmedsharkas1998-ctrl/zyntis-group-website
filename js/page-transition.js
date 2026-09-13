/**
 * ZYNTIS GROUP — Cross-Page Transitions
 * Provides cinematic dual-panel page transitions between index and contact pages.
 * Includes defensive fallback watchdog to guarantee content is never occluded.
 */
(function () {
  'use strict';

  const tx = document.getElementById('px-tx');
  const p1 = tx ? tx.querySelector('.px-p1') : null;
  const p2 = tx ? tx.querySelector('.px-p2') : null;
  const EASE = 'cubic-bezier(.76, 0, .24, 1)';

  // Fail-safe watchdog: NEVER let html.px-cover stay permanently
  function clearCover() {
    document.documentElement.classList.remove('px-cover');
    if (tx) {
      tx.style.display = 'none';
      if (p1) p1.style.transform = '';
      if (p2) p2.style.transform = '';
    }
  }
  const watchdog = setTimeout(clearCover, 1000);

  function slide(el, from, to, dur, delay) {
    if (!el || !el.animate) return Promise.resolve();
    try {
      const anim = el.animate(
        [{ transform: 'translateY(' + from + ')' }, { transform: 'translateY(' + to + ')' }],
        { duration: dur, delay: delay || 0, easing: EASE, fill: 'forwards' }
      );
      return anim.finished ? anim.finished.catch(() => {}) : Promise.resolve();
    } catch (_) {
      return Promise.resolve();
    }
  }

  // Reveal page on load if arriving via page transition
  function enter() {
    if (!tx || !p1 || !p2) {
      clearCover();
      return;
    }
    tx.style.display = 'block';
    p1.style.transform = 'translateY(0%)';
    p2.style.transform = 'translateY(0%)';
    document.documentElement.classList.remove('px-cover');

    requestAnimationFrame(() => {
      Promise.all([
        slide(p2, '0%', '-100%', 520, 0),
        slide(p1, '0%', '-100%', 520, 80)
      ]).then(() => {
        clearTimeout(watchdog);
        clearCover();
      }).catch(() => {
        clearCover();
      });
    });
  }

  // Check if incoming transition is active
  if (sessionStorage.getItem('pxnav') === '1' || document.documentElement.classList.contains('px-cover')) {
    sessionStorage.removeItem('pxnav');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enter);
    } else {
      enter();
    }
  } else {
    clearTimeout(watchdog);
    clearCover();
  }

  // Exit transition on outgoing internal navigation
  function exit(targetUrl) {
    if (!tx || !p1 || !p2) {
      window.location.href = targetUrl;
      return;
    }

    tx.style.display = 'block';
    sessionStorage.setItem('pxnav', '1');

    let navigated = false;
    const go = () => {
      if (!navigated) {
        navigated = true;
        window.location.href = targetUrl;
      }
    };

    Promise.all([
      slide(p1, '100%', '0%', 440, 0),
      slide(p2, '100%', '0%', 440, 70)
    ]).then(go).catch(go);

    // Fallback in case animation stalls
    setTimeout(go, 600);
  }

  // Global click listener for internal HTML links
  document.addEventListener('click', e => {
    if (e.defaultPrevented) return;
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    let targetUrl;
    try {
      targetUrl = new URL(a.href, window.location.href);
    } catch (_) {
      return;
    }

    // Only transition within the same origin
    if (targetUrl.origin !== window.location.origin) return;

    // Normalize path to ignore trailing index.html vs root slash
    const norm = p => p.replace(/\/index\.html$/, '/');
    if (norm(targetUrl.pathname) === norm(window.location.pathname)) {
      if (targetUrl.hash) return;
      return;
    }

    e.preventDefault();
    exit(targetUrl.href);
  });
})();
