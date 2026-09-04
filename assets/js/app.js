/* ===== HOTEASIK — Obsidian x Prezi 테마 로직 ===== */
(function () {
  "use strict";

  var POST_DIR = "_post/";
  var MANIFEST = POST_DIR + "manifest.json";

  var state = {
    posts: [],
    byId: {},
    scale: 1,
    tx: 0,
    ty: 0,
    minScale: 0.35,
    maxScale: 2.2,
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    bindStaticUI();
    loadPosts();
  }

  function cacheEls() {
    els.postList = document.getElementById("post-list");
    els.cards = document.getElementById("cards");
    els.canvasWrap = document.getElementById("canvas-wrap");
    els.canvasInner = document.getElementById("canvas-inner");
    els.edges = document.getElementById("edges");
    els.graphSvg = document.getElementById("graph-svg");
    els.search = document.getElementById("search");
    els.sidebar = document.getElementById("sidebar");
    els.sidebarToggle = document.getElementById("sidebar-toggle");
    els.reader = document.getElementById("reader");
    els.readerBackdrop = document.getElementById("reader-backdrop");
    els.readerPanel = document.getElementById("reader-panel");
    els.readerClose = document.getElementById("reader-close");
    els.readerMeta = document.getElementById("reader-meta");
    els.readerTitle = document.getElementById("reader-title");
    els.readerTags = document.getElementById("reader-tags");
    els.readerBody = document.getElementById("reader-body");
    els.readerLinks = document.getElementById("reader-links");
    els.zoomIn = document.getElementById("zoom-in");
    els.zoomOut = document.getElementById("zoom-out");
    els.zoomReset = document.getElementById("zoom-reset");
  }

  /* ---------- Data loading ---------- */

  function loadPosts() {
    fetch(MANIFEST)
      .then(function (r) {
        if (!r.ok) throw new Error("manifest not found");
        return r.json();
      })
      .then(function (files) {
        return Promise.all(
          files.map(function (file) {
            return fetch(POST_DIR + file)
              .then(function (r) { return r.text(); })
              .then(function (raw) { return buildPost(file, raw); });
          })
        );
      })
      .then(function (posts) {
        posts.sort(function (a, b) { return (a.date < b.date) ? 1 : -1; });
        state.posts = posts;
        posts.forEach(function (p) { state.byId[p.id] = p; });
        render();
        openFromHash();
      })
      .catch(function (err) {
        els.postList.innerHTML = '<div class="post-list-empty">글을 불러오지 못했습니다.<br>(' + escapeHtml(err.message) + ')</div>';
        console.error(err);
      });
  }

  function buildPost(file, raw) {
    var fm = parseFrontmatter(raw);
    var meta = fm.meta;
    var body = fm.body.trim();
    return {
      id: meta.id || file.replace(/\.md$/, ""),
      file: file,
      title: meta.title || file,
      date: meta.date || "",
      tags: toArray(meta.tags),
      links: toArray(meta.links),
      x: Number(meta.x) || 0,
      y: Number(meta.y) || 0,
      bodyRaw: body,
      excerpt: makeExcerpt(body),
    };
  }

  function parseFrontmatter(raw) {
    var m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: raw };
    var meta = {};
    m[1].split("\n").forEach(function (line) {
      var idx = line.indexOf(":");
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var val = line.slice(idx + 1).trim();
      meta[key] = val;
    });
    return { meta: meta, body: m[2] };
  }

  function toArray(val) {
    if (!val) return [];
    var s = String(val).trim();
    if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
    return s.split(",").map(function (x) {
      return x.trim().replace(/^["']|["']$/g, "");
    }).filter(Boolean);
  }

  function makeExcerpt(body) {
    var text = body
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[#>*_`-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 110 ? text.slice(0, 110) + "…" : text;
  }

  /* ---------- Render ---------- */

  function render() {
    renderSidebar();
    renderCards();
    renderGraph();
    requestAnimationFrame(renderEdges);
    centerCanvas();
  }

  function renderSidebar(filter) {
    els.postList.innerHTML = "";
    if (!state.posts.length) {
      els.postList.innerHTML = '<div class="post-list-empty">아직 글이 없습니다.</div>';
      return;
    }
    state.posts.forEach(function (p) {
      var match = !filter || matchesFilter(p, filter);
      var item = document.createElement("div");
      item.className = "post-item" + (match ? "" : " is-dimmed");
      item.dataset.id = p.id;
      item.innerHTML =
        '<div class="post-item-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="post-item-meta">' + escapeHtml(p.date) + '</div>';
      item.addEventListener("click", function () { flyToAndOpen(p.id); });
      els.postList.appendChild(item);
    });
  }

  function matchesFilter(p, filter) {
    var q = filter.toLowerCase();
    if (p.title.toLowerCase().indexOf(q) !== -1) return true;
    return p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
  }

  function renderCards() {
    els.cards.innerHTML = "";
    state.posts.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "card";
      card.style.left = p.x + "px";
      card.style.top = p.y + "px";
      card.dataset.id = p.id;
      card.innerHTML =
        '<div class="card-date">' + escapeHtml(p.date) + '</div>' +
        '<div class="card-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="card-excerpt">' + escapeHtml(p.excerpt) + '</div>' +
        '<div class="card-tags">' + p.tags.map(function (t) {
          return '<span class="tag">#' + escapeHtml(t) + '</span>';
        }).join("") + '</div>';
      card.addEventListener("click", function () { openPost(p.id, card); });
      els.cards.appendChild(card);
    });
  }

  function renderEdges() {
    var ns = "http://www.w3.org/2000/svg";
    els.edges.innerHTML = "";
    var seen = {};
    state.posts.forEach(function (p) {
      p.links.forEach(function (targetId) {
        var target = state.byId[targetId];
        if (!target) return;
        var key = [p.id, targetId].sort().join("|");
        if (seen[key]) return;
        seen[key] = true;
        var x1 = p.x + 130, y1 = p.y + 40;
        var x2 = target.x + 130, y2 = target.y + 40;
        var line = document.createElementNS(ns, "line");
        line.setAttribute("x1", x1 + 2000);
        line.setAttribute("y1", y1 + 2000);
        line.setAttribute("x2", x2 + 2000);
        line.setAttribute("y2", y2 + 2000);
        line.setAttribute("class", "edge-line");
        els.edges.appendChild(line);
      });
    });
  }

  function renderGraph() {
    var ns = "http://www.w3.org/2000/svg";
    els.graphSvg.innerHTML = "";
    var posts = state.posts;
    if (!posts.length) return;
    var cx = 120, cy = 85, r = 60;
    var pos = {};
    posts.forEach(function (p, i) {
      var angle = (i / posts.length) * Math.PI * 2 - Math.PI / 2;
      pos[p.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    var seen = {};
    posts.forEach(function (p) {
      p.links.forEach(function (targetId) {
        if (!pos[targetId]) return;
        var key = [p.id, targetId].sort().join("|");
        if (seen[key]) return;
        seen[key] = true;
        var a = pos[p.id], b = pos[targetId];
        var line = document.createElementNS(ns, "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        line.setAttribute("class", "graph-edge");
        els.graphSvg.appendChild(line);
      });
    });

    posts.forEach(function (p) {
      var g = document.createElementNS(ns, "g");
      g.setAttribute("class", "graph-node");
      g.dataset.id = p.id;
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", pos[p.id].x);
      c.setAttribute("cy", pos[p.id].y);
      c.setAttribute("r", 5);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("x", pos[p.id].x);
      t.setAttribute("y", pos[p.id].y + 13);
      t.setAttribute("text-anchor", "middle");
      t.textContent = truncate(p.title, 10);
      g.appendChild(c);
      g.appendChild(t);
      g.addEventListener("click", function () { flyToAndOpen(p.id); });
      els.graphSvg.appendChild(g);
    });
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

  /* ---------- Canvas zoom / pan ---------- */

  function applyTransform() {
    els.canvasInner.style.transform =
      "translate(" + state.tx + "px," + state.ty + "px) scale(" + state.scale + ")";
  }

  function centerCanvas() {
    if (!state.posts.length) { applyTransform(); return; }
    var xs = state.posts.map(function (p) { return p.x; });
    var ys = state.posts.map(function (p) { return p.y; });
    var midX = (Math.min.apply(null, xs) + Math.max.apply(null, xs) + 260) / 2;
    var midY = (Math.min.apply(null, ys) + Math.max.apply(null, ys) + 120) / 2;
    var rect = els.canvasWrap.getBoundingClientRect();
    state.scale = 0.9;
    state.tx = rect.width / 2 - midX * state.scale;
    state.ty = rect.height / 2 - midY * state.scale;
    applyTransform();
  }

  function bindStaticUI() {
    els.canvasWrap.addEventListener("wheel", onWheel, { passive: false });

    var dragging = false, lastX = 0, lastY = 0;
    els.canvasWrap.addEventListener("mousedown", function (e) {
      if (e.target.closest(".card, .placed-part")) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      els.canvasWrap.classList.add("is-dragging");
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      state.tx += e.clientX - lastX;
      state.ty += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      applyTransform();
    });
    window.addEventListener("mouseup", function () {
      dragging = false;
      els.canvasWrap.classList.remove("is-dragging");
    });

    els.zoomIn.addEventListener("click", function () { zoomBy(1.2); });
    els.zoomOut.addEventListener("click", function () { zoomBy(1 / 1.2); });
    els.zoomReset.addEventListener("click", centerCanvas);

    els.search.addEventListener("input", function () {
      var q = els.search.value.trim();
      renderSidebar(q);
      state.posts.forEach(function (p) {
        var card = els.cards.querySelector('.card[data-id="' + cssEscape(p.id) + '"]');
        if (!card) return;
        var match = !q || matchesFilter(p, q);
        card.classList.toggle("is-dimmed", !match);
      });
    });

    els.sidebarToggle.addEventListener("click", function () {
      els.sidebar.classList.toggle("is-open");
    });

    els.readerClose.addEventListener("click", closeReader);
    els.readerBackdrop.addEventListener("click", closeReader);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeReader();
    });

    window.addEventListener("hashchange", openFromHash);
  }

  function onWheel(e) {
    e.preventDefault();
    var rect = els.canvasWrap.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomAt(mx, my, factor);
  }

  function zoomBy(factor) {
    var rect = els.canvasWrap.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
  }

  function zoomAt(mx, my, factor) {
    var newScale = clamp(state.scale * factor, state.minScale, state.maxScale);
    var ratio = newScale / state.scale;
    state.tx = mx - (mx - state.tx) * ratio;
    state.ty = my - (my - state.ty) * ratio;
    state.scale = newScale;
    applyTransform();
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function flyToAndOpen(id) {
    var post = state.byId[id];
    if (!post) return;
    var rect = els.canvasWrap.getBoundingClientRect();
    var targetScale = clamp(1.1, state.minScale, state.maxScale);
    state.scale = targetScale;
    state.tx = rect.width / 2 - (post.x + 130) * targetScale;
    state.ty = rect.height / 2 - (post.y + 70) * targetScale;
    els.canvasInner.style.transition = "transform 0.5s cubic-bezier(.2,.8,.2,1)";
    applyTransform();
    setTimeout(function () {
      els.canvasInner.style.transition = "";
      var card = els.cards.querySelector('.card[data-id="' + cssEscape(id) + '"]');
      openPost(id, card);
    }, 480);
    if (window.innerWidth <= 860) els.sidebar.classList.remove("is-open");
  }

  /* ---------- Reader ---------- */

  function openFromHash() {
    var id = location.hash.replace("#", "");
    if (id && state.byId[id]) openPost(id, els.cards.querySelector('.card[data-id="' + cssEscape(id) + '"]'));
  }

  function openPost(id, originEl) {
    var post = state.byId[id];
    if (!post) return;

    if (originEl) {
      var r = originEl.getBoundingClientRect();
      var originX = ((r.left + r.width / 2) / window.innerWidth) * 100;
      var originY = ((r.top + r.height / 2) / window.innerHeight) * 100;
      els.readerPanel.style.transformOrigin = originX + "% " + originY + "%";
    } else {
      els.readerPanel.style.transformOrigin = "50% 50%";
    }

    els.readerMeta.textContent = post.date;
    els.readerTitle.textContent = post.title;
    els.readerTags.innerHTML = post.tags.map(function (t) {
      return '<span class="tag">#' + escapeHtml(t) + '</span>';
    }).join("");

    var html = (window.marked && window.marked.parse)
      ? window.marked.parse(linkifyWikiLinks(post.bodyRaw))
      : escapeHtml(post.bodyRaw).replace(/\n/g, "<br>");
    els.readerBody.innerHTML = html;

    els.readerBody.querySelectorAll("a[data-wikilink]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        openPost(a.dataset.wikilink, null);
      });
    });

    if (post.links.length) {
      els.readerLinks.innerHTML = '<div class="reader-links-title">연결된 글</div>' +
        post.links.map(function (lid) {
          var lp = state.byId[lid];
          if (!lp) return "";
          return '<div class="reader-link-item" data-id="' + lid + '">→ ' + escapeHtml(lp.title) + '</div>';
        }).join("");
      els.readerLinks.querySelectorAll(".reader-link-item").forEach(function (el) {
        el.addEventListener("click", function () { openPost(el.dataset.id, null); });
      });
    } else {
      els.readerLinks.innerHTML = "";
    }

    document.querySelectorAll(".post-item").forEach(function (el) {
      el.classList.toggle("is-active", el.dataset.id === id);
    });
    document.querySelectorAll(".graph-node").forEach(function (el) {
      el.classList.toggle("is-active", el.dataset.id === id);
    });

    history.replaceState(null, "", "#" + id);
    els.reader.classList.add("is-open");
    els.readerPanel.scrollTop = 0;
    requestAnimationFrame(function () {
      els.reader.classList.add("is-visible");
    });
  }

  function linkifyWikiLinks(text) {
    return text.replace(/\[\[(.*?)\]\]/g, function (_, id) {
      var p = state.byId[id.trim()];
      var label = p ? p.title : id;
      return '<a href="#' + id.trim() + '" data-wikilink="' + id.trim() + '">' + label + '</a>';
    });
  }

  function closeReader() {
    els.reader.classList.remove("is-visible");
    setTimeout(function () {
      els.reader.classList.remove("is-open");
    }, 200);
    history.replaceState(null, "", location.pathname);
  }

  /* ---------- utils ---------- */

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cssEscape(s) {
    return String(s).replace(/["\\]/g, "\\$&");
  }

  window.addEventListener("resize", function () {
    requestAnimationFrame(renderEdges);
  });

  // 공장 조립바(factory.js)에서 완성된 아키텍처의 글을 열 때 씀
  window.Hoteasik = { openPost: openPost };
})();
