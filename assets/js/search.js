/* ===== HOTEASIK · 검색 (Fuse.js) =====
   글자를 소문자 + 자모(NFD)로 풀어 색인한다. 그래서 대소문자와 한글 오타(어텐선 → 어텐션)를 흡수한다.
   제목·별칭(aliases)이 본문보다 우선하고, 결과가 없으면 비슷한 글과 태그를 제안한다.
*/
(function () {
  'use strict';

  var script = document.currentScript;
  var input = document.getElementById('search-input');
  var box = document.getElementById('search-results');
  if (!input || !box || !script) return;

  var MAX = 10;
  var OPTIONS = {
    keys: [
      { name: 'nTitle', weight: 4 },
      { name: 'nAliases', weight: 4 },
      { name: 'nTags', weight: 2 },
      { name: 'nCategories', weight: 1 },
      { name: 'nContent', weight: 0.5 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2
  };

  var docs = [];
  var fuse = null;
  var looseFuse = null;
  var loading = null;
  var active = -1;

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD'); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load() {
    if (loading) return loading;
    loading = fetch(script.getAttribute('data-json'))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        docs = data.map(function (d) {
          d.nTitle = norm(d.title);
          d.nAliases = norm(d.aliases);
          d.nTags = norm(d.tags);
          d.nCategories = norm(d.categories);
          d.nContent = norm(d.content);
          return d;
        });
        fuse = new Fuse(docs, OPTIONS);
        looseFuse = new Fuse(docs, Object.assign({}, OPTIONS, { threshold: 0.5 }));
      })
      .catch(function () { loading = null; });
    return loading;
  }

  /* 입력한 그대로 일치하는 부분만 강조한다 */
  function mark(text, q) {
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function snippet(text, q) {
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    var start = i > 40 ? i - 40 : 0;
    return (start ? '…' : '') + mark(text.slice(start, start + 140), q) + (text.length > start + 140 ? '…' : '');
  }

  function article(d, q) {
    var meta = '';
    if (d.categories) meta += '<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>' + esc(d.categories) + '</div>';
    if (d.tags) meta += '<div><i class="fa fa-tag fa-fw"></i>' + esc(d.tags) + '</div>';
    return '<article class="px-1 px-sm-2 px-lg-4 px-xl-0"><header><h2><a href="' + esc(d.url) + '">' + mark(d.title, q) +
      '</a></h2><div class="post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1">' + meta +
      '</div></header><p>' + snippet(d.content, q) + '</p></article>';
  }

  function topTags() {
    var count = {};
    docs.forEach(function (d) {
      d.tags.split(', ').forEach(function (t) { if (t) count[t] = (count[t] || 0) + 1; });
    });
    return Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 6);
  }

  function emptyView(q) {
    var near = looseFuse.search(norm(q), { limit: 3 });
    var tagBase = script.getAttribute('data-tags');
    var html = '<p class="mt-5">' + esc(script.getAttribute('data-empty')) + '</p><div class="search-suggest">';
    if (near.length) {
      html += '<h3>혹시 이 글을 찾으셨나요?</h3>' + near.map(function (r) { return article(r.item, q); }).join('');
    }
    html += '<h3>많이 쓰인 태그</h3><p>' + topTags().map(function (t) {
      return '<a class="post-tag me-2" href="' + esc(tagBase + encodeURIComponent(t.toLowerCase()) + '/') + '">' + esc(t) + '</a>';
    }).join('') + '</p></div>';
    return html;
  }

  /* 입력과 똑같은 제목, 입력이 들어간 제목 순으로 앞에 둔다 */
  function rank(r, q) {
    var title = r.item.title.toLowerCase();
    if (title === q) return 0;
    if (title.indexOf(q) === 0) return 1;
    if (title.indexOf(q) > 0) return 2;
    return 3;
  }

  function render() {
    var q = input.value.trim();
    active = -1;
    if (!q) { box.innerHTML = ''; return; }

    load().then(function () {
      if (!fuse || input.value.trim() !== q) return;
      var lower = q.toLowerCase();
      var hits = fuse.search(norm(q));
      var ordered = hits
        .map(function (r, i) { return { r: r, i: i, rank: rank(r, lower) }; })
        .sort(function (a, b) { return a.rank - b.rank || a.i - b.i; })
        .slice(0, MAX);
      box.innerHTML = ordered.length
        ? ordered.map(function (o) { return article(o.r.item, q); }).join('')
        : emptyView(q);
    });
  }

  function move(step) {
    var items = box.querySelectorAll('article');
    if (!items.length) return;
    if (items[active]) items[active].classList.remove('search-active');
    active = (active + step + items.length) % items.length;
    items[active].classList.add('search-active');
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function openSearch() {
    var trigger = document.getElementById('search-trigger');
    if (trigger && trigger.offsetParent) trigger.click();
    input.focus();
    input.select();
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', render);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    if (e.key === 'Enter') {
      var link = box.querySelector(active >= 0 ? 'article.search-active a' : 'article a');
      if (link) location.href = link.href;
    }
  });

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    var isK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
    if (isK || (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      openSearch();
    }
  });
})();
