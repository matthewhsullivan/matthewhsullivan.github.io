// Small enhancements only. Every page works without this file.
(function () {
  // Copy buttons: <button class="copy" data-copy="text">
  document.querySelectorAll('.copy[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var label = btn.textContent;
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = label; }, 1600); };
      var fallback = function () {
        var addr = btn.parentElement.querySelector('.addr');
        if (!addr) return;
        var range = document.createRange(); range.selectNodeContents(addr);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = 'Selected';
        setTimeout(function () { btn.textContent = label; }, 1600);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
      } catch (e) { fallback(); }
    });
  });

  // Only one reel plays at a time.
  var videos = Array.prototype.slice.call(document.querySelectorAll('video'));
  videos.forEach(function (v) {
    v.addEventListener('play', function () {
      videos.forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
    });
  });

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();

// Photo viewer for the Photography page
(function () {
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;
  var dlg = document.getElementById('lightbox');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'lightbox'; dlg.id = 'lightbox'; dlg.setAttribute('aria-label', 'Photo viewer');
    dlg.innerHTML = '<figure><img id="lb-img" alt=""><figcaption id="lb-cap"></figcaption></figure>' +
      '<div class="lb-controls"><button type="button" id="lb-prev" aria-label="Previous photo">&larr;</button>' +
      '<button type="button" id="lb-close" aria-label="Close">Close</button>' +
      '<button type="button" id="lb-next" aria-label="Next photo">&rarr;</button></div>';
    document.body.appendChild(dlg);
  }
  if (typeof dlg.showModal !== 'function') return; // without <dialog>, photos simply stay inline
  var img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap');
  var set = shots, i = 0;
  function show(n) {
    i = (n + set.length) % set.length;
    var src = set[i].querySelector('img');
    var fc = set[i].parentElement.querySelector('figcaption');
    img.src = src.getAttribute('src'); img.alt = src.alt;
    cap.textContent = fc ? fc.textContent : '';
  }
  shots.forEach(function (b) {
    b.addEventListener('click', function () {
      // On project pages, step through that project's photos only; on the gallery, through all of them.
      var group = b.closest('.case-photos');
      set = group ? Array.prototype.slice.call(group.querySelectorAll('.shot')) : shots.filter(function (x) { return !x.closest('.case-photos'); });
      show(set.indexOf(b)); dlg.showModal();
    });
  });
  document.getElementById('lb-prev').addEventListener('click', function () { show(i - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { show(i + 1); });
  document.getElementById('lb-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  // Swipe between photos on touch screens.
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();

// Homepage phone: switch between the KSA reels.
(function () {
  var v = document.getElementById('phone-video');
  if (!v) return;
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.phone-tabs button'));
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.classList.contains('on')) return;
      tabs.forEach(function (t) { t.classList.remove('on'); t.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      v.pause();
      v.setAttribute('poster', b.getAttribute('data-poster'));
      v.querySelector('source').setAttribute('src', b.getAttribute('data-src'));
      v.setAttribute('aria-label', 'KSA promo video: ' + b.getAttribute('data-label'));
      v.load();
    });
  });
})();

// Homepage camera: photo slideshow on the screen.
(function () {
  var screen = document.querySelector('.cam-screen');
  if (!screen) return;
  var imgs = Array.prototype.slice.call(screen.querySelectorAll('img'));
  var setEl = document.getElementById('cam-set'), countEl = document.getElementById('cam-count');
  var playBtn = document.getElementById('cam-play');
  var i = 0, timer = null, visible = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce;
  function show(n) {
    imgs[i].classList.remove('on');
    i = (n + imgs.length) % imgs.length;
    var img = imgs[i];
    img.loading = 'eager';
    img.classList.add('on');
    imgs[(i + 1) % imgs.length].loading = 'eager';   // warm up the next one
    setEl.textContent = img.getAttribute('data-set');
    countEl.textContent = (i + 1) + '/' + imgs.length;
  }
  function tick() { show(i + 1); }
  function sync() {
    clearInterval(timer); timer = null;
    if (playing && visible) timer = setInterval(tick, 3500);
    playBtn.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
  }
  document.getElementById('cam-prev').addEventListener('click', function () { show(i - 1); sync(); });
  document.getElementById('cam-next').addEventListener('click', function () { show(i + 1); sync(); });
  playBtn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }).observe(screen);
  }
  sync();
})();

/* Scroll reveal: elements enter with motion that suits them (rise, tilt, pop,
   slide, photo "window" opening, headings word by word, stats counting up).
   Only off-screen elements are prepared, so nothing flickers on load. Each item
   animates once, then its classes are removed. Off for reduced motion. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var variants = [
    ['.section-head > .eyebrow, .section-head > p, .band-link', 'up'],
    ['.section-head > h2, .lens-copy h2, .about-teaser h2, .contact h2', 'words'],
    ['.folders > .folder, .threads > .thread, .certs > li', 'tilt'],
    ['.entry, .ledger-group > h2, .set-head, .about-section', 'up'],
    ['.feature-copy > :not(h2)', 'up'],
    ['.phone-stage .phone', 'rise-big'],
    ['.phone-stage .bubble', 'pop'],
    ['.phone-tabs', 'up'],
    ['.tools-carousel', 'up'],
    ['.certs-h', 'up'],
    ['.cert-shots > .cert', 'tilt'],
    ['.touch-h, .touch-mail', 'up'],
    ['.touch-icons > li', 'pop'],
    ['.lens-wrap .camera', 'from-left'],
    ['.lens-copy > :not(h2)', 'from-right'],
    ['.about-teaser .prose > :not(h2), .contact .prose > :not(h2)', 'up'],
    ['.about-teaser .photo-card, .case-photos:not(.deck-strip) > *, .g-row > *, .reels', 'window'],
    ['.deck-strip', 'up'],
    ['.case-body > *, .about-grid > *', 'up']
  ];

  var vh = window.innerHeight;
  function skip(el) { return el.closest('.hero, .page-head') || (el.parentElement && el.parentElement.closest('.rv')); }

  function splitWords(h) {
    if (h.children.length) return false;           // only plain-text headings
    var text = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.textContent = '';
    text.forEach(function (w, i) {
      var o = document.createElement('span'); o.className = 'w'; o.setAttribute('aria-hidden', 'true');
      var n = document.createElement('span'); n.className = 'wi'; n.textContent = w;
      n.style.transitionDelay = 'calc(var(--rv-d, 0s) + ' + (i * 0.07).toFixed(2) + 's)';
      o.appendChild(n); h.appendChild(o);
      if (i < text.length - 1) h.appendChild(document.createTextNode(' '));
    });
    return true;
  }

  function countUp(dt) {
    var raw = dt.getAttribute('data-raw') || dt.textContent;
    dt.setAttribute('data-raw', raw);
    var m = raw.match(/^([^\d]*)([\d,]+)(.*)$/);
    if (!m) return;
    if (parseInt(m[2].replace(/,/g, ''), 10) < 10) return;   // "1 hour" etc. read oddly counting from 0
    var target = parseInt(m[2].replace(/,/g, ''), 10), comma = m[2].indexOf(',') > -1, t0 = null, dur = 1500;
    var run = (dt._run || 0) + 1; dt._run = run;
    dt.style.minWidth = dt.offsetWidth + 'px';
    function fmt(v) { return comma ? v.toLocaleString('en-US') : String(v); }
    function step(ts) {
      if (dt._run !== run) return;
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      dt.textContent = m[1] + fmt(Math.round(target * e)) + m[3];
      if (k < 1) requestAnimationFrame(step); else dt.textContent = raw;
    }
    dt.textContent = m[1] + '0' + m[3];
    requestAnimationFrame(step);
  }

  function reveal(list) {
    list.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    list.forEach(function (el, i) {
      if (el.classList.contains('stats')) {
        el.querySelectorAll('dt').forEach(function (dt, j) { setTimeout(function () { countUp(dt); }, 250 + j * 150); });
        if (!el.classList.contains('rv')) return;
      }
      if (el.classList.contains('in')) return;
      var base = el.classList.contains('bubble') ? 0.5 : 0;
      el.style.setProperty('--rv-d', (base + Math.min(i, 8) * 0.1).toFixed(2) + 's');
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    });
  }
  // Re-arm an element once it has dropped fully below the screen (you scrolled back up
  // past it), so it plays again the next time you scroll down. Items above the screen
  // stay in place, so scrolling up never shows things flying in backwards.
  function rearm(el) {
    if (el.classList.contains('stats')) { el.querySelectorAll('dt').forEach(function (dt) { dt._run = (dt._run || 0) + 1; if (dt.getAttribute('data-raw')) dt.textContent = dt.getAttribute('data-raw'); }); }
    if (!el.classList.contains('in')) return;
    el.classList.add('rv-reset'); el.classList.remove('in'); el.style.removeProperty('--rv-d');
    void el.offsetWidth;
    el.classList.remove('rv-reset');
  }

  var enter = new IntersectionObserver(function (entries) {
    reveal(entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; }));
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  var leave = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting && e.rootBounds && e.boundingClientRect.top >= e.rootBounds.bottom) rearm(e.target);
    });
  }, { threshold: 0 });

  var all = [];
  variants.forEach(function (v) {
    document.querySelectorAll(v[0]).forEach(function (el) {
      if (el.classList.contains('rv') || skip(el)) return;
      if (v[1] === 'words' && !splitWords(el)) el.setAttribute('data-rv', 'up');
      else el.setAttribute('data-rv', v[1]);
      // already on screen at load: show it as-is, no flash
      if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add('in');
      el.classList.add('rv');
      all.push(el);
    });
  });
  document.querySelectorAll('.stats').forEach(function (s) { if (all.indexOf(s) < 0) all.push(s); });
  all.forEach(function (el) { enter.observe(el); leave.observe(el); });
  document.querySelectorAll('[data-rv="tilt"]').forEach(function (el, i) { el.style.setProperty('--rv-r', (i % 2 ? 3 : -3) + 'deg'); });
})();

/* Tools turntable: icons float on a slowly turning ring. Drag (mouse or touch)
   or use the arrow keys to spin it; it eases back to its slow spin on release.
   Pauses when off screen. Reduced motion: no auto-spin, still draggable. */
(function () {
  var box = document.querySelector('.tools-carousel');
  if (!box) return;
  var items = Array.prototype.slice.call(box.querySelectorAll('.tools > li'));
  var n = items.length, step = Math.PI * 2 / n;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var auto = reduce ? 0 : 0.0019;              // radians per frame (~one turn per 55s)
  var angle = 0, vel = auto, dragging = false, lastX = 0, lastT = 0, visible = true, raf = 0, t = 0;
  box.classList.add('is-3d');

  function layout() {
    var w = box.clientWidth, small = w < 600,
        rx = small ? w * 0.62 : Math.min(w * 0.43, 480), lift = small ? 58 : Math.min(120, Math.max(70, w * 0.085));
    t += 1;
    for (var i = 0; i < n; i++) {
      var a = angle + i * step, s = Math.sin(a), c = Math.cos(a);   // c = 1 is front and center
      var depth = (c + 1) / 2;                                         // 0 back .. 1 front
      var bob = reduce ? 0 : Math.sin(t / 70 + i * 1.7) * 6;
      var x = s * rx, y = -(1 - depth) * lift * 1.15 + bob;   // back of the ring sits higher, like a turntable seen from above
      var sc = 0.56 + 0.44 * depth;
      var el = items[i];
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      el.style.setProperty('--fade', (0.62 * Math.pow(1 - depth, 1.2)).toFixed(3));   // cards stay solid; the back ones are washed out
      el.style.zIndex = String(Math.round(depth * 100));
      el.classList.toggle('is-front', depth > 0.97);
    }
  }
  function frame() {
    raf = 0;
    if (!dragging) { vel += (auto - vel) * 0.03; angle += vel; }
    layout();
    if (visible && (!reduce || dragging || Math.abs(vel) > 0.00005)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  box.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; lastT = performance.now(); vel = 0;
    box.setPointerCapture(e.pointerId); box.classList.add('dragging'); kick();
  });
  box.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var now = performance.now(), dx = e.clientX - lastX, k = 1 / Math.max(260, box.clientWidth * 0.42);
    angle += dx * k; vel = dx * k / Math.max(1, (now - lastT) / 16.7);
    lastX = e.clientX; lastT = now;
  });
  function end() { if (!dragging) return; dragging = false; box.classList.remove('dragging'); kick(); }
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('lostpointercapture', end);
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); vel += (e.key === 'ArrowLeft' ? -1 : 1) * 0.045; kick(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(box);
  }
  window.addEventListener('resize', layout);
  layout(); kick();
})();
