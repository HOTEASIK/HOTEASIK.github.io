/* ===== HOTEASIK · 블로그 글 필터 =====
   분야(카테고리)와 태그를 AND 로 좁힌다. 선택 상태는 /blog/?cats=부품&tags=CNN,풀링 처럼 URL 에 남긴다.
*/
(function () {
  'use strict';

  var bar = document.getElementById('post-filter');
  if (!bar) return;

  var posts = Array.prototype.slice.call(document.querySelectorAll('#post-list article'));
  var chips = Array.prototype.slice.call(bar.querySelectorAll('button[data-key]'));
  var count = document.getElementById('filter-count');
  var clear = bar.querySelector('.filter-clear');
  var params = new URLSearchParams(location.search);
  var state = {
    cats: (params.get('cats') || '').split(',').filter(Boolean),
    tags: (params.get('tags') || '').split(',').filter(Boolean)
  };

  function values(post, key) {
    return (post.getAttribute('data-' + key) || '').split('|').filter(Boolean);
  }

  function matches(post, picked) {
    return ['cats', 'tags'].every(function (key) {
      var own = values(post, key);
      return picked[key].every(function (v) { return own.indexOf(v) !== -1; });
    });
  }

  function withChip(key, value) {
    return {
      cats: state.cats.concat(key === 'cats' ? [value] : []),
      tags: state.tags.concat(key === 'tags' ? [value] : [])
    };
  }

  function syncUrl() {
    var next = new URLSearchParams(location.search);
    ['cats', 'tags'].forEach(function (key) {
      if (state[key].length) next.set(key, state[key].join(','));
      else next.delete(key);
    });
    var query = next.toString();
    history.replaceState(null, '', location.pathname + (query ? '?' + query : ''));
  }

  function apply() {
    var shown = 0;
    posts.forEach(function (post) {
      var on = matches(post, state);
      post.hidden = !on;
      post.classList.toggle('d-none', !on);
      if (on) shown += 1;
    });

    chips.forEach(function (chip) {
      var key = chip.getAttribute('data-key');
      var value = chip.getAttribute('data-value');
      var pressed = state[key].indexOf(value) !== -1;
      chip.setAttribute('aria-pressed', String(pressed));
      /* 고르면 결과가 0건이 되는 칩은 끈다 */
      chip.disabled = !pressed && !posts.some(function (post) { return matches(post, withChip(key, value)); });
    });

    count.textContent = shown + ' / ' + posts.length + '개 글';
    clear.hidden = !state.cats.length && !state.tags.length;
    syncUrl();
  }

  bar.addEventListener('click', function (e) {
    var chip = e.target.closest('button');
    if (!chip) return;
    if (chip === clear) {
      state.cats = [];
      state.tags = [];
    } else {
      var list = state[chip.getAttribute('data-key')];
      var value = chip.getAttribute('data-value');
      var i = list.indexOf(value);
      if (i === -1) list.push(value);
      else list.splice(i, 1);
    }
    apply();
  });

  apply();
})();
