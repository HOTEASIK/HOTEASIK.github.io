/* ===== HOTEASIK · 팩토리 맵 인터랙션 ===== */
(function () {
  'use strict';

  var factory = document.getElementById('factory');
  var scene = document.getElementById('factory-scene');
  var plate = document.getElementById('factory-plate');
  if (!factory || !scene) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 시차(패럴랙스) ---------- */
  if (fine && !reduce) {
    var tx = 0, ty = 0, raf = 0;
    scene.addEventListener('mousemove', function (e) {
      var r = scene.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(commit);
    });
    scene.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(commit);
    });
    function commit() {
      raf = 0;
      factory.style.setProperty('--px', tx.toFixed(3));
      factory.style.setProperty('--py', ty.toFixed(3));
    }
  }

  /* ---------- 명판 ---------- */
  function showPlate(el) {
    if (!plate) return;
    var text = el.getAttribute('data-plate');
    if (!text) return;
    plate.textContent = text;
    plate.hidden = false;
    var fr = factory.getBoundingClientRect();
    var br = el.getBoundingClientRect();
    plate.style.left = (br.left - fr.left + br.width / 2) + 'px';
    plate.style.top = (br.top - fr.top + 6) + 'px';
  }
  function hidePlate() { if (plate) plate.hidden = true; }

  Array.prototype.forEach.call(scene.querySelectorAll('.bldg'), function (b) {
    b.addEventListener('mouseenter', function () { showPlate(b); });
    b.addEventListener('mouseleave', hidePlate);
    b.addEventListener('focus', function () { showPlate(b); });
    b.addEventListener('blur', hidePlate);
  });
})();
