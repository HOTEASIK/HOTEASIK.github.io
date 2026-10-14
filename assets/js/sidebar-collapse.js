/* ===== HOTEASIK · 3단 사이드바 (펼침 → 아이콘레일 → 숨김) =====
   상태는 <html data-sb="expanded|rail|hidden"> + localStorage 에 저장.
   데스크톱(≥1200px)에서만 의미가 있고, 모바일은 Chirpy 기본 슬라이드가 담당한다.
*/
(function () {
  'use strict';

  var KEY = 'hoteasik-sb';
  var CYCLE = ['expanded', 'rail', 'hidden'];
  var root = document.documentElement;

  function current() {
    var v = root.getAttribute('data-sb');
    return CYCLE.indexOf(v) === -1 ? 'expanded' : v;
  }

  function apply(state, persist) {
    if (state === 'expanded') root.removeAttribute('data-sb');
    else root.setAttribute('data-sb', state);
    if (persist) {
      try { localStorage.setItem(KEY, state); } catch (e) {}
    }
    var t = document.getElementById('sb-toggle');
    if (t) {
      t.setAttribute('aria-expanded', String(state !== 'hidden'));
      var i = t.querySelector('i');
      if (i) i.className = state === 'expanded'
        ? 'fas fa-angles-left'
        : (state === 'rail' ? 'fas fa-grip-lines-vertical' : 'fas fa-angles-left');
    }
  }

  function step(dir) {
    var idx = CYCLE.indexOf(current());
    idx = (idx + dir + CYCLE.length) % CYCLE.length;
    apply(CYCLE[idx], true);
  }

  function wire() {
    var toggle = document.getElementById('sb-toggle');
    var reopen = document.getElementById('sb-reopen');

    if (toggle) {
      toggle.addEventListener('click', function () { step(1); });
    }
    if (reopen) {
      reopen.addEventListener('click', function () { apply('expanded', true); });
    }

    // 키보드: Ctrl/Cmd + \  로 순환
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        step(1);
      }
    });

    // 좁은 화면으로 줄어들면 데스크톱 3단 상태는 시각적으로 무효 → 그대로 두되
    // 다시 넓어졌을 때 저장값을 따른다 (CSS 미디어쿼리가 알아서 처리).
    apply(current(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
