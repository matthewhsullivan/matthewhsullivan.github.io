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
  var dlg = document.getElementById('lightbox');
  if (!dlg || typeof dlg.showModal !== 'function') return; // without <dialog>, photos simply stay inline
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gallery .shot'));
  var img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap');
  var i = 0;
  function show(n) {
    i = (n + shots.length) % shots.length;
    var src = shots[i].querySelector('img');
    var fc = shots[i].parentElement.querySelector('figcaption');
    img.src = src.getAttribute('src'); img.alt = src.alt;
    cap.textContent = fc ? fc.textContent : '';
  }
  shots.forEach(function (b, n) { b.addEventListener('click', function () { show(n); dlg.showModal(); }); });
  document.getElementById('lb-prev').addEventListener('click', function () { show(i - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { show(i + 1); });
  document.getElementById('lb-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();
