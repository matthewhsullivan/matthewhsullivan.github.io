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
