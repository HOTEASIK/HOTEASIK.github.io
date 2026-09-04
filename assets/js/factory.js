/* ===== HOTEASIK — 신경망 조립 공장 (부품 폴더 · 그래프 · 작업대 배치 · 컨베이어 조립) ===== */
(function () {
  "use strict";

  var PARTS_DIR = "_parts/";
  var PARTS_MANIFEST = PARTS_DIR + "manifest.json";
  var RECIPES_URL = PARTS_DIR + "recipes.json";

  var parts = [];
  var partsById = {};
  var recipes = [];
  var sequence = []; // 컨베이어에 놓인 부품 id 순서 (왼쪽=입력 → 오른쪽=출력)

  var partsReady = false;
  var posts = null; // app.js 쪽 글 목록 (그래프 합치는 용도)

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    loadParts();
    bindPostsBridge();
  }

  function cacheEls() {
    els.partsGrid = document.getElementById("parts-grid");
    els.canvasWrap = document.getElementById("canvas-wrap");
    els.canvasInner = document.getElementById("canvas-inner");
    els.placedParts = document.getElementById("placed-parts");
    els.assemblyBar = document.getElementById("assembly-bar");
    els.assemblyTrack = document.getElementById("assembly-track");
    els.assemblySlots = document.getElementById("assembly-slots");
    els.assemblyReadout = document.getElementById("assembly-readout");
    els.assemblyClear = document.getElementById("assembly-clear");
    els.partDetail = document.getElementById("part-detail");
    els.partDetailBackdrop = document.getElementById("part-detail-backdrop");
    els.partDetailClose = document.getElementById("part-detail-close");
    els.partDetailIcon = document.getElementById("part-detail-icon");
    els.partDetailTitle = document.getElementById("part-detail-title");
    els.partDetailDesc = document.getElementById("part-detail-desc");
    els.graphSvg = document.getElementById("graph-svg");
  }

  /* ---------- 부품: 폴더 단위로 로딩 (_parts/<id>/part.md + icon) ---------- */

  function loadParts() {
    fetch(PARTS_MANIFEST)
      .then(function (r) { return r.json(); })
      .then(function (folders) {
        return Promise.all([
          Promise.all(folders.map(function (folder) {
            return fetch(PARTS_DIR + folder + "/part.md")
              .then(function (r) { return r.text(); })
              .then(function (raw) { return buildPart(folder, raw); });
          })),
          fetch(RECIPES_URL).then(function (r) { return r.json(); }),
        ]);
      })
      .then(function (res) {
        parts = res[0];
        recipes = res[1];
        parts.forEach(function (p) { partsById[p.id] = p; });
        partsReady = true;
        renderPartsGrid();
        bindDnD();
        bindPartDetail();
        renderAssembly();
        maybeRenderGraph();
      })
      .catch(function (err) {
        els.partsGrid.innerHTML = '<div class="post-list-empty">부품 목록을 불러오지 못했습니다.</div>';
        console.error(err);
      });
  }

  function buildPart(folder, raw) {
    var fm = parseFrontmatter(raw);
    var meta = fm.meta;
    var iconFile = meta.icon || "icon.svg";
    return {
      id: meta.id || folder,
      folder: folder,
      label: meta.label || folder,
      category: meta.category || folder,
      icon: PARTS_DIR + folder + "/" + iconFile,
      desc: fm.body.trim(),
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
      var val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      meta[key] = val;
    });
    return { meta: meta, body: m[2] };
  }

  /* ---------- 글(post) 쪽과 연결 — 그래프 합치기용 ---------- */

  function bindPostsBridge() {
    document.addEventListener("hoteasik:posts-ready", function (e) {
      posts = e.detail.posts;
      maybeRenderGraph();
    });
    // app.js가 factory.js보다 먼저 끝났을 경우 대비
    if (window.Hoteasik && typeof window.Hoteasik.getPosts === "function") {
      var p = window.Hoteasik.getPosts();
      if (p && p.length) { posts = p; }
    }
    maybeRenderGraph();
  }

  /* ---------- 부품 목록 ---------- */

  function renderPartsGrid() {
    els.partsGrid.innerHTML = "";
    parts.forEach(function (p) {
      var chip = document.createElement("div");
      chip.className = "part-chip";
      chip.draggable = true;
      chip.dataset.id = p.id;
      chip.innerHTML = '<img src="' + escapeAttr(p.icon) + '" alt="">' +
        '<span>' + escapeHtml(p.label) + '</span>';

      chip.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "copy";
      });
      chip.addEventListener("click", function () { openPartDetail(p.id); });

      els.partsGrid.appendChild(chip);
    });
  }

  /* ---------- 드래그 앤 드롭 ---------- */

  function bindDnD() {
    els.canvasWrap.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    els.canvasWrap.addEventListener("drop", function (e) {
      var id = e.dataTransfer.getData("text/plain");
      if (!partsById[id]) return;
      e.preventDefault();
      var pos = screenToCanvas(e.clientX, e.clientY);
      placePartOnCanvas(id, pos.x, pos.y);
    });

    els.assemblyTrack.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      els.assemblyTrack.classList.add("is-dragover");
    });
    els.assemblyTrack.addEventListener("dragleave", function () {
      els.assemblyTrack.classList.remove("is-dragover");
    });
    els.assemblyTrack.addEventListener("drop", function (e) {
      els.assemblyTrack.classList.remove("is-dragover");
      var id = e.dataTransfer.getData("text/plain");
      if (!partsById[id]) return;
      e.preventDefault();
      sequence.push(id);
      renderAssembly();
    });

    els.assemblyClear.addEventListener("click", function () {
      sequence = [];
      renderAssembly();
    });
  }

  function screenToCanvas(clientX, clientY) {
    var rect = els.canvasWrap.getBoundingClientRect();
    var localX = clientX - rect.left;
    var localY = clientY - rect.top;
    var t = getComputedStyle(els.canvasInner).transform;
    var matrix = (t && t !== "none") ? new DOMMatrixReadOnly(t) : new DOMMatrixReadOnly();
    var inv = matrix.inverse();
    var pt = inv.transformPoint(new DOMPoint(localX, localY));
    return { x: pt.x, y: pt.y };
  }

  function placePartOnCanvas(id, x, y) {
    var p = partsById[id];
    var el = document.createElement("div");
    el.className = "placed-part";
    el.style.left = (x - 28) + "px";
    el.style.top = (y - 28) + "px";
    el.innerHTML = '<img src="' + escapeAttr(p.icon) + '" alt="">' +
      '<span>' + escapeHtml(p.label) + '</span>';
    el.title = "클릭하면 작업대에서 치웁니다";
    el.addEventListener("click", function () { el.remove(); });
    els.placedParts.appendChild(el);
  }

  /* ---------- 컨베이어 조립 & 인식 ---------- */

  function renderAssembly() {
    els.assemblySlots.innerHTML = "";
    sequence.forEach(function (id, i) {
      if (i > 0) {
        var arrow = document.createElement("span");
        arrow.className = "assembly-arrow";
        arrow.textContent = "→";
        els.assemblySlots.appendChild(arrow);
      }
      var p = partsById[id];
      var slot = document.createElement("div");
      slot.className = "assembly-slot";
      slot.title = "클릭하면 컨베이어에서 치웁니다";
      slot.innerHTML = '<img src="' + escapeAttr(p.icon) + '" alt="">' +
        '<span>' + escapeHtml(p.label) + '</span>';
      slot.addEventListener("click", function () {
        sequence.splice(i, 1);
        renderAssembly();
      });
      els.assemblySlots.appendChild(slot);
    });
    checkMatch();
  }

  function checkMatch() {
    var matched = recognize(sequence);
    els.assemblyBar.classList.toggle("is-matched", !!matched);

    if (matched) {
      els.assemblyReadout.classList.add("is-matched");
      els.assemblyReadout.innerHTML = "";

      var nameEl = document.createElement(matched.postId ? "a" : "span");
      nameEl.className = "match-name" + (matched.postId ? " match-name-link" : "");
      nameEl.textContent = "✨ " + matched.label + " 완성!" + (matched.postId ? " →" : "");
      if (matched.postId) {
        nameEl.href = "#" + matched.postId;
        nameEl.title = "\"" + matched.label + "\" 노트로 이동";
        nameEl.addEventListener("click", function (e) {
          e.preventDefault();
          if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(matched.postId, null);
        });
      }
      els.assemblyReadout.appendChild(nameEl);

      if (matched.hint) {
        var hintEl = document.createElement("div");
        hintEl.textContent = matched.hint;
        els.assemblyReadout.appendChild(hintEl);
      }
    } else {
      els.assemblyReadout.classList.remove("is-matched");
      els.assemblyReadout.textContent = sequence.length
        ? ("조립 중… (" + sequence.length + "개 부품)")
        : "대기 중…";
    }
  }

  function recognize(seq) {
    if (!seq.length) return null;

    var exact = recipes.find(function (r) {
      return !r.loose && arraysEqual(r.sequence, seq);
    });
    if (exact) return exact;

    var categories = seq.map(function (id) {
      return partsById[id] ? partsById[id].category : null;
    });
    var loose = recipes.find(function (r) {
      return r.loose && isSubsequence(r.loosePattern, categories);
    });
    return loose || null;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function isSubsequence(pattern, arr) {
    var i = 0;
    for (var j = 0; j < arr.length && i < pattern.length; j++) {
      if (arr[j] === pattern[i]) i++;
    }
    return i === pattern.length;
  }

  /* ---------- 부품 상세 (부품 목록 클릭 시 새 캔버스) ---------- */

  function bindPartDetail() {
    els.partDetailClose.addEventListener("click", closePartDetail);
    els.partDetailBackdrop.addEventListener("click", closePartDetail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePartDetail();
    });
  }

  function openPartDetail(id) {
    var p = partsById[id];
    if (!p) return;
    els.partDetailIcon.src = p.icon;
    els.partDetailTitle.textContent = p.label;
    els.partDetailDesc.textContent = p.desc || "";
    els.partDetail.classList.add("is-open");
    requestAnimationFrame(function () {
      els.partDetail.classList.add("is-visible");
    });
  }

  function closePartDetail() {
    els.partDetail.classList.remove("is-visible");
    setTimeout(function () {
      els.partDetail.classList.remove("is-open");
    }, 200);
  }

  /* ---------- 그래프: 부품 폴더 + 글을 한 그래프에 배치 ---------- */

  function maybeRenderGraph() {
    if (!partsReady || !posts) return;
    renderCombinedGraph(posts, parts, recipes);
  }

  function partsUsedByRecipe(recipe) {
    if (recipe.sequence) {
      return uniq(recipe.sequence);
    }
    if (recipe.loosePattern) {
      var byCategory = {};
      parts.forEach(function (p) {
        (byCategory[p.category] = byCategory[p.category] || []).push(p.id);
      });
      var ids = [];
      recipe.loosePattern.forEach(function (cat) {
        (byCategory[cat] || []).forEach(function (id) { ids.push(id); });
      });
      return uniq(ids);
    }
    return [];
  }

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (!seen[v]) { seen[v] = true; out.push(v); } });
    return out;
  }

  function renderCombinedGraph(posts, parts, recipes) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = els.graphSvg;
    svg.innerHTML = "";

    var nodes = [];
    posts.forEach(function (p) { nodes.push({ key: "post:" + p.id, id: p.id, type: "post", title: p.title }); });
    parts.forEach(function (p) { nodes.push({ key: "part:" + p.id, id: p.id, type: "part", title: p.label }); });
    if (!nodes.length) return;

    var cx = 120, cy = 85, r = Math.min(72, 34 + nodes.length * 3.5);
    var pos = {};
    nodes.forEach(function (n, i) {
      var angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      pos[n.key] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    var edges = [];
    var seenEdge = {};

    posts.forEach(function (p) {
      (p.links || []).forEach(function (targetId) {
        if (!posts.some(function (pp) { return pp.id === targetId; })) return;
        var key = ["post:" + p.id, "post:" + targetId].sort().join("|");
        if (seenEdge[key]) return;
        seenEdge[key] = true;
        edges.push(["post:" + p.id, "post:" + targetId]);
      });
    });

    recipes.forEach(function (recipe) {
      if (!recipe.postId) return;
      partsUsedByRecipe(recipe).forEach(function (partId) {
        if (!partsById[partId]) return;
        var key = "part:" + partId + "|post:" + recipe.postId;
        if (seenEdge[key]) return;
        seenEdge[key] = true;
        edges.push(["part:" + partId, "post:" + recipe.postId]);
      });
    });

    edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]];
      if (!a || !b) return;
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", a.x);
      line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x);
      line.setAttribute("y2", b.y);
      line.setAttribute("class", "graph-edge");
      svg.appendChild(line);
    });

    nodes.forEach(function (n) {
      var g = document.createElementNS(ns, "g");
      g.setAttribute("class", "graph-node" + (n.type === "part" ? " is-part" : ""));
      g.dataset.id = n.id;
      g.dataset.type = n.type;
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", pos[n.key].x);
      c.setAttribute("cy", pos[n.key].y);
      c.setAttribute("r", n.type === "part" ? 4 : 5);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("x", pos[n.key].x);
      t.setAttribute("y", pos[n.key].y + 12);
      t.setAttribute("text-anchor", "middle");
      t.textContent = truncate(n.title, 9);
      g.appendChild(c);
      g.appendChild(t);
      g.addEventListener("click", function () {
        if (n.type === "post") {
          if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(n.id, null);
        } else {
          openPartDetail(n.id);
        }
      });
      svg.appendChild(g);
    });
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

  /* ---------- utils ---------- */

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeAttr(s) { return escapeHtml(s); }
})();
