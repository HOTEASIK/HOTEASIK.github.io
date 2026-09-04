/* ===== HOTEASIK — 신경망 조립 공장 (부품 창고 트리 · 그래프 · 작업대 배치 · 컨베이어 조립) ===== */
(function () {
  "use strict";

  // 공용 유틸(utils.js)에서 가져다 씀 — 중복 구현하지 않음
  var escapeHtml = window.HoteasikUtils.escapeHtml;
  var escapeAttr = window.HoteasikUtils.escapeAttr;
  var cssEscapeAttr = window.HoteasikUtils.cssEscapeAttr;
  var parseFrontmatter = window.HoteasikUtils.parseFrontmatter;

  var PARTS_DIR = "_parts/";
  var MANIFEST_URL = PARTS_DIR + "manifest.json";
  var RECIPES_URL = PARTS_DIR + "recipes.json";

  var tree = null;       // 부품 창고 트리(폴더+부품), 루트는 화면에 안 그림
  var parts = [];        // 트리에서 뽑아낸 leaf 부품들 (평탄화)
  var partsById = {};
  var recipes = [];
  var sequence = [];     // 컨베이어에 놓인 부품 id 순서 (왼쪽=입력 → 오른쪽=출력)

  var partsReady = false;
  var posts = null;      // app.js 쪽 글 목록 (그래프 합치는 용도)
  var folderCounter = 0;

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    loadParts();
    bindPostsBridge();
    bindBuildButton();
  }

  function cacheEls() {
    els.partsTree = document.getElementById("parts-tree");
    els.canvasWrap = document.getElementById("canvas-wrap");
    els.canvasInner = document.getElementById("canvas-inner");
    els.placedParts = document.getElementById("placed-parts");
    els.assemblyBar = document.getElementById("assembly-bar");
    els.assemblyTrack = document.getElementById("assembly-track");
    els.assemblySlots = document.getElementById("assembly-slots");
    els.assemblyReadout = document.getElementById("assembly-readout");
    els.assemblyClear = document.getElementById("assembly-clear");
    els.assemblyBuildBtn = document.getElementById("assembly-build-btn");
    els.partDetail = document.getElementById("part-detail");
    els.partDetailBackdrop = document.getElementById("part-detail-backdrop");
    els.partDetailClose = document.getElementById("part-detail-close");
    els.partDetailIcon = document.getElementById("part-detail-icon");
    els.partDetailTitle = document.getElementById("part-detail-title");
    els.partDetailDesc = document.getElementById("part-detail-desc");
    els.partDetailLink = document.getElementById("part-detail-link");
    els.graphSvg = document.getElementById("graph-svg");
  }

  /* ---------- 부품 창고: 트리(폴더 안에 폴더) 로딩 ---------- */

  function loadParts() {
    fetch(MANIFEST_URL)
      .then(function (r) { return r.json(); })
      .then(function (root) {
        tree = root;
        prepareTree(tree);
        var leaves = [];
        collectLeaves(tree, leaves);
        return Promise.all([
          Promise.all(leaves.map(function (leaf) {
            return fetch(PARTS_DIR + leaf.path + "/part.md")
              .then(function (r) { return r.text(); })
              .then(function (raw) { leaf.part = buildPart(leaf.path, raw); });
          })),
          fetch(RECIPES_URL).then(function (r) { return r.json(); }),
        ]);
      })
      .then(function (res) {
        recipes = res[1];
        parts = [];
        var leaves = [];
        collectLeaves(tree, leaves);
        leaves.forEach(function (leaf) {
          parts.push(leaf.part);
          partsById[leaf.part.id] = leaf.part;
        });

        partsReady = true;
        renderPartsTree();
        bindDnD();
        bindPartDetail();
        renderAssembly();
        maybeRenderGraph();
      })
      .catch(function (err) {
        els.partsTree.innerHTML = '<div class="post-list-empty">부품 창고를 불러오지 못했습니다.</div>';
        console.error(err);
      });
  }

  // 폴더에 고유 key(gkey) 부여, part 노드에는 경로 기반 key 부여
  function prepareTree(node) {
    if (node.type === "folder") {
      node.gkey = "folder-" + (folderCounter++);
      (node.children || []).forEach(prepareTree);
    } else if (node.type === "part") {
      node.gkey = "part:" + node.path;
    }
  }

  function collectLeaves(node, out) {
    if (node.type === "part") {
      out.push(node);
    } else if (node.children) {
      node.children.forEach(function (c) { collectLeaves(c, out); });
    }
    return out;
  }

  function buildPart(path, raw) {
    var fm = parseFrontmatter(raw);
    var meta = fm.meta;
    var iconFile = meta.icon || "icon.svg";
    return {
      id: meta.id || path,
      path: path,
      label: meta.label || path,
      category: meta.category || path,
      icon: PARTS_DIR + path + "/" + iconFile,
      desc: fm.body.trim(),
      postId: meta.postId || null,
      recurrent: meta.recurrent === "true",
    };
  }

  function badgeHtml(part) {
    return part.recurrent
      ? ' <span class="recur-badge" title="매 타임스텝마다 반복">↻</span>'
      : "";
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
      if (p && p.length) posts = p;
    }
    maybeRenderGraph();
  }

  /* ---------- 부품 창고 트리 렌더 (사이드바) ---------- */

  function renderPartsTree() {
    els.partsTree.innerHTML = "";
    var frag = document.createDocumentFragment();
    (tree.children || []).forEach(function (child) {
      frag.appendChild(renderTreeNode(child, 0));
    });
    els.partsTree.appendChild(frag);
  }

  function renderTreeNode(node, depth) {
    if (node.type === "folder") {
      var wrap = document.createElement("div");
      wrap.className = "tree-folder";
      wrap.dataset.gkey = node.gkey;

      var row = document.createElement("div");
      row.className = "tree-folder-row";
      row.draggable = true;
      row.style.paddingLeft = (6 + depth * 14) + "px";
      row.dataset.gkey = node.gkey;
      row.innerHTML =
        '<span class="tree-caret">▾</span>' +
        '<span class="tree-folder-icon">🗂</span>' +
        '<span class="tree-folder-label">' + escapeHtml(node.label) + '</span>';

      row.addEventListener("click", function () {
        wrap.classList.toggle("is-collapsed");
      });
      row.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "folder", label: node.label }));
        e.dataTransfer.effectAllowed = "copy";
        e.stopPropagation();
      });

      var childrenWrap = document.createElement("div");
      childrenWrap.className = "tree-children";
      (node.children || []).forEach(function (c) {
        childrenWrap.appendChild(renderTreeNode(c, depth + 1));
      });

      wrap.appendChild(row);
      wrap.appendChild(childrenWrap);
      return wrap;
    }

    // leaf part
    var p = node.part;
    var chip = document.createElement("div");
    chip.className = "part-chip";
    chip.draggable = true;
    chip.dataset.id = p.id;
    chip.style.paddingLeft = (6 + depth * 14) + "px";
    chip.innerHTML = '<img src="' + escapeAttr(p.icon) + '" alt="">' +
      '<span>' + escapeHtml(p.label) + badgeHtml(p) + '</span>';

    chip.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "part", id: p.id }));
      e.dataTransfer.effectAllowed = "copy";
    });
    chip.addEventListener("click", function () { openPartDetail(p.id); });

    return chip;
  }

  /* ---------- 드래그 앤 드롭 ---------- */

  function bindDnD() {
    els.canvasWrap.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    els.canvasWrap.addEventListener("drop", function (e) {
      var payload = readPayload(e);
      if (!payload) return;
      e.preventDefault();
      var pos = screenToCanvas(e.clientX, e.clientY);

      if (payload.kind === "part" && partsById[payload.id]) {
        placePartOnCanvas(payload.id, pos.x, pos.y);
      } else if (payload.kind === "folder") {
        placeFolderOnCanvas(payload.label, pos.x, pos.y);
      } else if (payload.kind === "post") {
        var post = posts && posts.find(function (pp) { return pp.id === payload.id; });
        if (post) placeNoteOnCanvas(post, pos.x, pos.y);
      }
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
      var payload = readPayload(e);
      if (!payload || payload.kind !== "part" || !partsById[payload.id]) return;
      e.preventDefault();
      sequence.push(payload.id);
      renderAssembly();
    });

    els.assemblyClear.addEventListener("click", function () {
      sequence = [];
      renderAssembly();
    });
  }

  function readPayload(e) {
    var raw = e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (err) { return null; }
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
      '<span>' + escapeHtml(p.label) + badgeHtml(p) + '</span>';
    el.title = "클릭하면 작업대에서 치웁니다";
    el.addEventListener("click", function () { el.remove(); });
    els.placedParts.appendChild(el);
  }

  function placeFolderOnCanvas(label, x, y) {
    var el = document.createElement("div");
    el.className = "placed-folder";
    el.style.left = (x - 34) + "px";
    el.style.top = (y - 30) + "px";
    el.innerHTML = '<span class="icon">🗂</span><span>' + escapeHtml(label) + '</span>';
    el.title = "클릭하면 작업대에서 치웁니다";
    el.addEventListener("click", function () { el.remove(); });
    els.placedParts.appendChild(el);
  }

  function placeNoteOnCanvas(post, x, y) {
    var el = document.createElement("div");
    el.className = "placed-note";
    el.style.left = (x - 75) + "px";
    el.style.top = (y - 30) + "px";
    el.innerHTML =
      '<div class="placed-note-remove" title="치우기">✕</div>' +
      '<div class="placed-note-date">' + escapeHtml(post.date) + '</div>' +
      '<div class="placed-note-title">' + escapeHtml(post.title) + '</div>';
    el.title = "클릭하면 이 노트를 엽니다";
    el.addEventListener("click", function () {
      if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(post.id, null);
    });
    el.querySelector(".placed-note-remove").addEventListener("click", function (e) {
      e.stopPropagation();
      el.remove();
    });
    els.placedParts.appendChild(el);
  }

  /* ---------- 컨베이어 조립 (놓기만 함, 인식은 "제작" 버튼으로) ---------- */

  function renderAssembly() {
    els.assemblySlots.innerHTML = "";
    var frag = document.createDocumentFragment();
    sequence.forEach(function (id, i) {
      if (i > 0) {
        var arrow = document.createElement("span");
        arrow.className = "assembly-arrow";
        arrow.textContent = "→";
        frag.appendChild(arrow);
      }
      var p = partsById[id];
      var slot = document.createElement("div");
      slot.className = "assembly-slot";
      slot.title = "클릭하면 컨베이어에서 치웁니다";
      slot.innerHTML = '<img src="' + escapeAttr(p.icon) + '" alt="">' +
        '<span>' + escapeHtml(p.label) + badgeHtml(p) + '</span>';
      slot.addEventListener("click", function () {
        sequence.splice(i, 1);
        renderAssembly();
      });
      frag.appendChild(slot);
    });
    els.assemblySlots.appendChild(frag);
    showIdle();
  }

  function showIdle() {
    els.assemblyBar.classList.remove("is-matched", "is-failed");
    els.assemblyReadout.classList.remove("is-matched", "is-failed-text");
    els.assemblyReadout.textContent = sequence.length
      ? ("조립 중… (" + sequence.length + "개 부품) — 제작을 눌러 확인하세요")
      : "대기 중…";
  }

  function bindBuildButton() {
    els.assemblyBuildBtn.addEventListener("click", runBuild);
  }

  function runBuild() {
    if (!sequence.length) {
      els.assemblyBar.classList.add("is-failed");
      setTimeout(function () { els.assemblyBar.classList.remove("is-failed"); }, 400);
      return;
    }

    var matched = recognize(sequence);

    if (matched) {
      els.assemblyBar.classList.add("is-matched");
      els.assemblyBar.classList.remove("is-failed");
      els.assemblyReadout.classList.add("is-matched");
      els.assemblyReadout.classList.remove("is-failed-text");
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
    } else {
      els.assemblyBar.classList.remove("is-matched");
      els.assemblyBar.classList.add("is-failed");
      els.assemblyReadout.classList.remove("is-matched");
      els.assemblyReadout.classList.add("is-failed-text");
      els.assemblyReadout.textContent = "❌ 인식된 구조가 없습니다. 순서를 확인해 보세요.";
      setTimeout(function () { els.assemblyBar.classList.remove("is-failed"); }, 500);
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

  /* ---------- 부품 상세 (부품 클릭 시 새 캔버스) ---------- */

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
    els.partDetailTitle.innerHTML = escapeHtml(p.label) + badgeHtml(p);
    els.partDetailDesc.textContent = p.desc || "";

    els.partDetailLink.innerHTML = "";
    if (p.postId) {
      var link = document.createElement("a");
      link.className = "part-detail-note-link";
      link.href = "#" + p.postId;
      link.textContent = "노트에서 자세히 보기 →";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        closePartDetail();
        if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(p.postId, null);
      });
      els.partDetailLink.appendChild(link);
    }

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

  /* ---------- 그래프: 부품 창고 트리 + 글을 한 그래프에 배치 (실제 레이아웃/렌더링은 graph.js가 함) ---------- */

  function maybeRenderGraph() {
    if (!partsReady || !posts) return;
    window.HoteasikGraph.render(
      els.graphSvg,
      { posts: posts, tree: tree, parts: parts, partsById: partsById, recipes: recipes },
      {
        onOpenPost: function (id) {
          if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(id, null);
        },
        onOpenPart: openPartDetail,
        onFocusFolder: focusSidebarFolder,
      }
    );
  }

  // 그래프의 폴더 노드를 클릭하면 사이드바에서 그 폴더를 펼치고 잠깐 반짝임
  function focusSidebarFolder(gkey) {
    var row = els.partsTree.querySelector('.tree-folder-row[data-gkey="' + cssEscapeAttr(gkey) + '"]');
    if (!row) return;
    var folderEl = row.closest(".tree-folder");
    if (folderEl) folderEl.classList.remove("is-collapsed");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("flash");
    setTimeout(function () { row.classList.remove("flash"); }, 900);
  }
})();
