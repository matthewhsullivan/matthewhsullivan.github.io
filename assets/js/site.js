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
