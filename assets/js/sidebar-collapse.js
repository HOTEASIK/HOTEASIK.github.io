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

    wireResizer();

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

  /* ── 드래그로 폭 조절 ──
     180~480px = 펼침(폭 저장) / 120px 미만 = 아이콘 레일 / 40px 미만 = 숨김 */
  var W_KEY = 'hoteasik-sb-w';
  var W_MIN = 180, W_MAX = 480, W_DEFAULT = 260, RAIL_AT = 120, HIDE_AT = 40;

  var expW = 0;   // 마지막으로 정한 펼침 폭 (애니메이션 중 실제 폭 대신 사용)

  function setWidth(w, persist) {
    w = Math.max(W_MIN, Math.min(W_MAX, Math.round(w)));
    expW = w;
    root.style.setProperty('--sb-exp', w + 'px');
    if (persist) {
      try { localStorage.setItem(W_KEY, String(w)); } catch (e) {}
    }
  }

  function widthNow() {
    var s = current();
    if (s === 'hidden') return 0;
    if (s === 'rail') return 74;
    if (expW) return expW;
    var v = parseInt(getComputedStyle(root).getPropertyValue('--sb-exp'), 10);
    return v || W_DEFAULT;
  }

  // x = 사이드바 오른쪽 끝이 될 위치
  function dragTo(x) {
    if (x < HIDE_AT) apply('hidden', false);
    else if (x < RAIL_AT) apply('rail', false);
    else { setWidth(x, false); apply('expanded', false); }
  }

  function commit() {
    var state = current();
    apply(state, true);
    if (state === 'expanded') setWidth(widthNow(), true);
  }


  function wireResizer() {
    var handle = document.getElementById('sb-resizer');
    if (!handle) return;
    var dragging = false;

    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      root.classList.add('sb-dragging');
    });
    handle.addEventListener('pointermove', function (e) {
      if (dragging) dragTo(e.clientX);
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('sb-dragging');
      commit();
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', end);

    // 더블클릭 = 기본 폭으로 펼침
    handle.addEventListener('dblclick', function () {
      setWidth(W_DEFAULT, true);
      apply('expanded', true);
    });

    // 키보드: ← → 로 16px 씩
    handle.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      dragTo(widthNow() + (e.key === 'ArrowRight' ? 16 : -16));
      commit();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
