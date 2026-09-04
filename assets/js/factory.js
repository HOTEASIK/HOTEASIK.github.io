/* ===== HOTEASIK — 신경망 조립 공장 (부품 목록 · 작업대 배치 · 컨베이어 조립) ===== */
(function () {
  "use strict";

  var PARTS_URL = "assets/parts/parts.json";
  var RECIPES_URL = "assets/parts/recipes.json";

  var parts = [];
  var partsById = {};
  var recipes = [];
  var sequence = []; // 컨베이어에 놓인 부품 id 순서 (왼쪽=입력 → 오른쪽=출력)

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    Promise.all([
      fetch(PARTS_URL).then(function (r) { return r.json(); }),
      fetch(RECIPES_URL).then(function (r) { return r.json(); }),
    ])
      .then(function (res) {
        parts = res[0];
        recipes = res[1];
        parts.forEach(function (p) { partsById[p.id] = p; });
        renderPartsGrid();
        bindDnD();
        bindPartDetail();
        renderAssembly();
      })
      .catch(function (err) {
        els.partsGrid.innerHTML = '<div class="post-list-empty">부품 목록을 불러오지 못했습니다.</div>';
        console.error(err);
      });
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
      els.assemblyReadout.innerHTML =
        '<span class="match-name">✨ ' + escapeHtml(matched.label) + ' 완성!</span>' +
        escapeHtml(matched.hint || "") +
        (matched.postId ? '<br><button class="assembly-open-btn" id="assembly-open-btn" type="button">자세히 보기 →</button>' : "");
      var btn = document.getElementById("assembly-open-btn");
      if (btn) {
        btn.addEventListener("click", function () {
          if (window.Hoteasik && window.Hoteasik.openPost) window.Hoteasik.openPost(matched.postId, null);
        });
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

  /* ---------- 부품 상세 (목록 클릭 시 새 캔버스) ---------- */

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

  /* ---------- utils ---------- */

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeAttr(s) { return escapeHtml(s); }
})();
