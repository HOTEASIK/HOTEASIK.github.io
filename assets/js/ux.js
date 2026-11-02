/* ===== HOTEASIK · 읽기 편의 =====
   - 모바일 상단바: 아래로 스크롤하면 숨기고 위로 올리면 보인다
   - 코드 블록: 줄바꿈 토글, {: data-lines="3-5" } 줄 강조
   - 집중 모드: 글 화면에서 F 키 또는 버튼 (Esc 로 종료)
*/
(function () {
  'use strict';

  var root = document.documentElement;

  function wireTopbar() {
    var bar = document.getElementById('topbar-wrapper');
    if (!bar) return;
    var last = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      bar.classList.toggle('topbar-hidden', window.innerWidth < 850 && y > last && y > 120);
      last = y;
    }, { passive: true });
  }

  function wireCodeWrap() {
    var KEY = 'hoteasik-code-wrap';
    var blocks = document.querySelectorAll('.content .highlighter-rouge:not(code)');
    var saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}

    function setAll(on) {
      blocks.forEach(function (block) {
        block.classList.toggle('code-wrap', on);
        var button = block.querySelector('.code-wrap-toggle');
        if (button) button.setAttribute('aria-pressed', String(on));
      });
    }

    blocks.forEach(function (block) {
      var header = block.querySelector('.code-header');
      if (!header) return;
      /* <button> 이면 Chirpy 의 복사 기능(.code-header button)이 같이 동작한다 */
      var button = document.createElement('div');
      button.className = 'code-wrap-toggle';
      button.textContent = '줄바꿈';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      button.setAttribute('aria-pressed', 'false');

      function toggle() {
        var on = !block.classList.contains('code-wrap');
        setAll(on);
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      }

      button.addEventListener('click', toggle);
      button.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      header.insertBefore(button, header.querySelector('button'));
    });

    setAll(saved);
  }

  function wireLineMarks() {
    document.querySelectorAll('[data-lines]').forEach(function (block) {
      var code = block.querySelector('.rouge-code pre') || block.querySelector('pre');
      if (!code) return;
      block.getAttribute('data-lines').split(',').forEach(function (part) {
        var range = part.split('-');
        var from = parseInt(range[0], 10);
        var to = parseInt(range[1] || range[0], 10);
        if (!from || !to) return;
        var mark = document.createElement('span');
        mark.className = 'code-line-mark';
        mark.style.top = 'calc(' + (from - 1) + ' * 1lh)';
        mark.style.height = 'calc(' + (to - from + 1) + ' * 1lh)';
        code.appendChild(mark);
      });
    });
  }

  function wireFocusMode() {
    if (!document.querySelector('article[data-toc]')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'focus-toggle';
    button.title = '집중 모드 (F)';
    button.setAttribute('aria-label', '집중 모드');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<i class="fas fa-book-open"></i>';
    document.body.appendChild(button);

    var progress = document.createElement('div');
    progress.id = 'read-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    function setFocus(on) {
      root.toggleAttribute('data-focus', on);
      button.setAttribute('aria-pressed', String(on));
    }

    button.addEventListener('click', function () { setFocus(!root.hasAttribute('data-focus')); });

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === 'f') setFocus(!root.hasAttribute('data-focus'));
      if (e.key === 'Escape') setFocus(false);
    });
  }

  function init() {
    wireTopbar();
    wireCodeWrap();
    wireLineMarks();
    wireFocusMode();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
