(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-nav');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  }
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = form.querySelector('.status');
      if (s) { s.hidden = false; }
    });
  }
})();

/* Seitenwechsel: immer oben starten, außer ein Abschnitt (#wingwave usw.) ist gewählt */
(function () {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function place() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'instant', block: 'start' }); }
    else { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  }
  place();
  window.addEventListener('load', place);
  window.addEventListener('pageshow', function (e) { if (e.persisted) place(); });
})();

/* ---------- Text- und Reveal-Animationen ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var root = document.documentElement;
  root.classList.add('anim');

  // Headlines Wort für Wort
  function splitWords(el, counter) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var i = document.createElement('span'); i.textContent = t;
          i.style.setProperty('--wi', counter.n++);
          w.appendChild(i); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        splitWords(n, counter);
      }
    });
  }
  document.querySelectorAll('main h1, main h2').forEach(function (h) {
    splitWords(h, { n: 0 });
    h.setAttribute('data-r', 'words');
  });

  // Blöcke, die weich einblenden
  var sel = [
    '.hero .kicker', '.hero .lines li', '.hero .actions',
    '.page-hero p', '.factors .lead', '.constellation',
    '.split .media', '.split .body > p', '.split .body > .btn',
    '.offers-intro > p', '.card', '.detail .media', '.detail .body > :not(h2)',
    '.price', '.price-note', '.placeholder', '.way', '.form', '.map', '.location .info > :not(h2)',
    '.cta p', '.cta .btn', '.site-footer .top > *'
  ].join(',');
  document.querySelectorAll(sel).forEach(function (el) {
    if (!el.hasAttribute('data-r')) el.setAttribute('data-r', 'fx');
  });
  // Staffelung innerhalb einer Gruppe
  var groups = new Map();
  document.querySelectorAll('[data-r="fx"]').forEach(function (el) {
    var k = el.parentNode, n = groups.get(k) || 0;
    el.style.setProperty('--dl', Math.min(n, 9) * 0.09 + 's');
    groups.set(k, n + 1);
  });

  function show(el) {
    el.classList.add('is-in');
    // danach eigene Hover-Übergänge wieder freigeben
    setTimeout(function () { el.removeAttribute('data-r'); el.classList.remove('is-in'); }, 2200);
  }
  // Verbindungslinien: wachsen per JavaScript vom roten Punkt nach außen (browserunabhängig, auch Safari)
  function prepLines(c) {
    var svg = c.querySelector('svg'); if (!svg) return;
    c._lines = Array.prototype.map.call(svg.querySelectorAll('line'), function (l) {
      var d = { el: l, x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'), cx: +l.getAttribute('x2'), cy: +l.getAttribute('y2') };
      l.setAttribute('x1', d.cx); l.setAttribute('y1', d.cy); return d;
    });
  }
  function growLines(c) {
    var ls = c._lines; if (!ls) return;
    var t0 = null, dur = 1600, delay = 150;
    function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.max(0, Math.min(1, (ts - t0 - delay) / dur)), e = ease(k);
      ls.forEach(function (d) { d.el.setAttribute('x1', d.cx + (d.x1 - d.cx) * e); d.el.setAttribute('y1', d.cy + (d.y1 - d.cy) * e); });
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('.constellation').forEach(prepLines);
  var ioLines = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); growLines(e.target); ioLines.unobserve(e.target); setTimeout(function () { e.target.removeAttribute('data-r'); e.target.classList.remove('is-in'); }, 3600); } });
  }, { threshold: 0.45 });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.querySelectorAll('[data-r]').forEach(function (el) {
        if (el.closest('.hero, .page-hero')) show(el); else if (el.classList.contains('constellation')) ioLines.observe(el); else io.observe(el);
      });
    });
  });
})();

/* Werdegang: Linie wächst mit dem Scrollen vom ersten bis zum roten Punkt; Punkte füllen sich beim Erreichen */
(function () {
  var wrap = document.querySelector('.tl-wrap');
  if (!wrap) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  wrap.classList.add('tl-js');
  var items = Array.prototype.slice.call(wrap.querySelectorAll('.timeline li'));
  var finale = wrap.querySelector('.tl-finale'), endDot = wrap.querySelector('.tl-dot');
  function dotCenter(li) { var cs = getComputedStyle(li, '::before'); return li.getBoundingClientRect().top + parseFloat(cs.top) + parseFloat(cs.height) / 2; }
  function update() {
    var w = wrap.getBoundingClientRect();
    var start = dotCenter(items[0]);
    var e = endDot.getBoundingClientRect(), end = e.top + e.height / 2;
    var len = end - start;
    wrap.style.setProperty('--tl-top', (start - w.top).toFixed(1) + 'px');
    wrap.style.setProperty('--tl-len', len.toFixed(1) + 'px');
    var p = reduce ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.62 - start) / len));
    wrap.style.setProperty('--tl-p', p.toFixed(4));
    var tip = start + p * len;
    items.forEach(function (li) { li.classList.toggle('is-reached', tip >= dotCenter(li) - 1); });
    finale.classList.toggle('is-reached', p >= 0.999);
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();
