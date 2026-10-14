/* ===== HOTEASIK · 데이터 전처리 전/후 위젯 토글 ===== */
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('.data-demo'), function (demo) {
    var btn = demo.querySelector('.data-demo-toggle');
    var before = demo.querySelector('.data-demo-before');
    var after = demo.querySelector('.data-demo-after');
    if (!btn || !before || !after) return;

    demo.setAttribute('data-state', 'before');

    btn.addEventListener('click', function () {
      var showAfter = after.hidden;
      after.hidden = !showAfter;
      before.hidden = showAfter;
      btn.setAttribute('aria-pressed', String(showAfter));
      demo.setAttribute('data-state', showAfter ? 'after' : 'before');
      btn.textContent = showAfter ? '← 전 보기' : '후 보기 →';
    });
  });
})();
