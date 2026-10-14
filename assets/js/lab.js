/* ===== HOTEASIK 조합·합성 랩 (vanilla, 의존성 없음) =====
   데이터는 lab.html 이 <script type="application/json"> 로 심어 준다.
   - #lab-notes      : 부품/개념 노트 [{id,title,url,layer,kind,icon,combinable,synthesizable,weight}]
   - #lab-recipes    : 조합 레시피 [{id,label,sequence?,loose?,post,hint?}]
   - #lab-syntheses  : 합성 레시피 [{id,label,inputs,loose?,post}]
   - #lab-all-posts  : { slug: {title,url} }  (결과 링크용)
*/
(function () {
  "use strict";

  var LAYER_ORDER = ["input", "hidden", "output", "training", "eval", "concept", "model"];
  var LAYER_LABEL = {
    input: "입력층", hidden: "은닉층", output: "출력층",
    training: "학습방법", eval: "평가방법", concept: "개념", model: "모델", "": "기타",
  };
  var KIND_LABEL = {
    activation: "활성화 함수", conv: "합성곱", recurrent: "순환", pooling: "풀링",
    dense: "완전연결", loss: "손실함수", norm: "정규화", attention: "어텐션",
    optimizer: "옵티마이저", regularization: "정규화 기법", scheduler: "스케줄러",
    embedding: "임베딩",
    classification: "분류 지표", regression: "회귀 지표", detection: "검출 지표",
    generation: "생성 지표", ranking: "랭킹 지표",
    "": "",
  };

  function parseJson(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try { return JSON.parse(el.textContent); } catch (e) { console.error("lab: bad JSON in #" + id, e); return fallback; }
  }

  var NOTES = parseJson("lab-notes", []);
  var RECIPES = parseJson("lab-recipes", []);
  var SYNTH = parseJson("lab-syntheses", []);
  var ALL_POSTS = parseJson("lab-all-posts", {});

  var byId = {};
  NOTES.forEach(function (n) { byId[n.id] = n; });

  var root = document.getElementById("lab-root");
  if (!root) return;

  // ---- 상태 (페이지 안에서만) ----
  var belt = [];   // 조합: 순서 있는 note id 배열 (층)
  var beltLoop = false; // 조합: 끝 → 처음 되먹임(순환 구조) 여부
  var train = [];  // 조합: 학습 방법(옵티마이저·손실함수 등), 순서 무관
  var box = [];    // 합성: 순서 없는 note id 배열

  // ---- 유틸 ----
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // 하단 도크 높이가 바뀌면 #lab-root 하단 여백을 다시 맞춘다 (resize 핸들러 재사용).
  function relayoutDock() {
    window.dispatchEvent(new Event("resize"));
  }
  function resultUrl(slug) {
    if (ALL_POSTS[slug] && ALL_POSTS[slug].url) return ALL_POSTS[slug].url;
    if (byId[slug]) return byId[slug].url;
    return "/posts/" + slug + "/";
  }
  function resultTitle(slug, fallback) {
    if (ALL_POSTS[slug] && ALL_POSTS[slug].title) return ALL_POSTS[slug].title;
    return fallback || slug;
  }

  function chipInner(note) {
    var icon = note.icon
      ? '<img src="' + esc(note.icon) + '" alt="" class="lab-chip-icon">'
      : '<span class="lab-chip-dot" data-layer="' + esc(note.layer || "") + '"></span>';
    return icon + '<span class="lab-chip-label">' + esc(note.title) + '</span>';
  }

  // ---- 대시보드 (칸반 보드) ----
  function buildDashboard() {
    var wrap = el("div", "lab-dashboard");
    wrap.appendChild(el("div", "lab-dashboard-title",
      "부품 · 개념 보드 <small>칼럼에서 카드를 드래그해 아래 작업대로 · 카드 클릭 = 그 글</small>"));

    var groups = {};
    NOTES.forEach(function (n) {
      var lay = n.layer || "";
      (groups[lay] = groups[lay] || {});
      var k = n.kind || "";
      (groups[lay][k] = groups[lay][k] || []).push(n);
    });

    var board = el("div", "lab-board");

    LAYER_ORDER.concat(Object.keys(groups).filter(function (l) { return LAYER_ORDER.indexOf(l) === -1; }))
      .forEach(function (lay) {
        if (!groups[lay]) return;

        var count = 0;
        Object.keys(groups[lay]).forEach(function (k) { count += groups[lay][k].length; });

        var col = el("div", "lab-board-col" + (lay === "hidden" || lay === "eval" ? " is-wide" : ""));
        col.dataset.layer = lay;
        col.appendChild(el("div", "lab-board-col-head",
          esc(LAYER_LABEL[lay] || lay) + '<span class="lab-col-count">' + count + '</span>'));

        var body = el("div", "lab-board-col-body");
        Object.keys(groups[lay]).forEach(function (k) {
          if (k) body.appendChild(el("div", "lab-board-kind", esc(KIND_LABEL[k] || k)));
          groups[lay][k].forEach(function (n) { body.appendChild(makeChip(n)); });
        });
        col.appendChild(body);
        board.appendChild(col);
      });

    wrap.appendChild(board);
    return wrap;
  }

  function makeChip(note) {
    var c = el("button", "lab-chip", chipInner(note));
    c.type = "button";
    c.draggable = true;
    c.dataset.id = note.id;
    c.title = note.title + " — 열기";
    c.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", note.id);
      e.dataTransfer.effectAllowed = "copy";
    });
    c.addEventListener("click", function () { window.location.href = note.url; });
    return c;
  }

  // ---- 드롭존 공통 ----
  function wireDropzone(zone, onDrop) {
    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      zone.classList.add("is-over");
    });
    zone.addEventListener("dragleave", function () { zone.classList.remove("is-over"); });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("is-over");
      var id = e.dataTransfer.getData("text/plain");
      if (id && byId[id]) onDrop(id);
    });
  }

  // ---- 조합 패널 ----
  function buildCombinePanel() {
    var panel = el("section", "lab-panel lab-combine");
    panel.hidden = true;
    panel.appendChild(el("h3", "lab-panel-title", "⚙ 조합 — 층 + 학습 방법"));
    panel.appendChild(el("p", "lab-panel-note",
      "왼쪽 벨트에 <strong>층</strong>을 순서대로, 오른쪽에 <strong>학습 방법</strong>(옵티마이저·손실함수 등)을 올립니다. " +
      "<strong>순환 신경망</strong>은 <strong>↩ 되먹임</strong>을 켜서 끝을 처음으로 이어 주세요."));

    var grid = el("div", "lab-combine-grid");

    var beltCol = el("div", "lab-combine-col");
    beltCol.appendChild(el("div", "lab-col-label", "① 층 — 순서대로 (적층/순환)"));
    var belt$ = el("div", "lab-belt");
    belt$.appendChild(el("span", "lab-belt-cap", "입력 ⟶"));
    var slots = el("div", "lab-belt-slots");
    belt$.appendChild(slots);
    belt$.appendChild(el("span", "lab-belt-cap", "⟶ 출력"));
    wireDropzone(belt$, function (id) { belt.push(id); renderBelt(); });
    beltCol.appendChild(belt$);
    grid.appendChild(beltCol);

    var trainCol = el("div", "lab-combine-col lab-train-col");
    trainCol.appendChild(el("div", "lab-col-label", "② 학습 방법 — 선택 (옵티마이저·손실함수 등)"));
    var train$ = el("div", "lab-train");
    wireDropzone(train$, function (id) {
      if ((byId[id].layer || "") !== "training") {
        flashMiss(train$);
        return;
      }
      if (train.indexOf(id) === -1) train.push(id);
      renderTrain();
    });
    trainCol.appendChild(train$);
    grid.appendChild(trainCol);

    panel.appendChild(grid);

    var actions = el("div", "lab-panel-actions");
    var build = el("button", "btn btn-primary btn-sm", "⚙ 제작");
    var loop = el("button", "btn btn-outline-primary btn-sm", "↩ 되먹임: 꺼짐");
    var clear = el("button", "btn btn-outline-secondary btn-sm", "초기화");
    build.type = loop.type = clear.type = "button";
    build.addEventListener("click", runCombine);
    loop.addEventListener("click", function () {
      beltLoop = !beltLoop;
      loop.textContent = beltLoop ? "↩ 되먹임: 켜짐" : "↩ 되먹임: 꺼짐";
      loop.classList.toggle("is-on", beltLoop);
      renderBelt();
    });
    clear.addEventListener("click", function () {
      belt = []; train = []; beltLoop = false;
      loop.textContent = "↩ 되먹임: 꺼짐"; loop.classList.remove("is-on");
      renderBelt(); renderTrain(); result.innerHTML = "";
    });
    actions.appendChild(build); actions.appendChild(loop); actions.appendChild(clear);
    panel.appendChild(actions);

    var result = el("div", "lab-result");
    panel.appendChild(result);

    panel._slots = slots;
    panel._train = train$;
    panel._result = result;
    return panel;

    function renderBelt() {
      slots.innerHTML = "";
      belt.forEach(function (id, i) {
        if (i > 0) slots.appendChild(el("span", "lab-arrow", "→"));
        var n = byId[id];
        var s = el("span", "lab-slot", chipInner(n));
        s.title = "클릭하면 제거";
        s.addEventListener("click", function () { belt.splice(i, 1); renderBelt(); });
        slots.appendChild(s);
      });
      if (!belt.length) slots.appendChild(el("span", "lab-empty", "부품을 여기로 드래그"));
      belt$.classList.toggle("is-recurrent", beltLoop && belt.length > 0);
      relayoutDock();
    }

    function renderTrain() {
      train$.innerHTML = "";
      train.forEach(function (id, i) {
        if (i > 0) train$.appendChild(el("span", "lab-plus", "+"));
        var n = byId[id];
        var s = el("span", "lab-slot", chipInner(n));
        s.title = "클릭하면 제거";
        s.addEventListener("click", function () { train.splice(i, 1); renderTrain(); });
        train$.appendChild(s);
      });
      if (!train.length) train$.appendChild(el("span", "lab-empty", "학습 방법을 여기로 (선택)"));
      relayoutDock();
    }
  }

  function flashMiss(zone) {
    zone.classList.add("is-miss");
    setTimeout(function () { zone.classList.remove("is-miss"); }, 400);
  }

  function runCombine() {
    var panel = document.querySelector(".lab-combine");
    var out = panel._result;
    var hit = recognizeCombine(belt, beltLoop, train);
    var trainStr = train.map(function (id) {
      return (byId[id] && byId[id].title) || id;
    }).join(" + ");
    var trainLine = trainStr
      ? '<div class="lab-result-hint">🎓 학습: ' + esc(trainStr) + '</div>'
      : "";
    if (hit) {
      out.className = "lab-result is-hit";
      out.innerHTML = '✨ ' + (hit.recurrent ? '<span class="lab-badge">순환</span> ' : '<span class="lab-badge is-ff">적층</span> ') +
        '<a href="' + esc(resultUrl(hit.post)) + '">' +
        esc(resultTitle(hit.post, hit.label)) + '</a> 완성!' +
        (hit.hint ? '<div class="lab-result-hint">' + esc(hit.hint) + '</div>' : "") +
        trainLine;
    } else {
      out.className = "lab-result is-miss";
      out.innerHTML = esc(beltLoop
        ? "❌ 이 되먹임 구조로 인식되는 모델이 없습니다. (순환 셀 + 완전연결이 필요할 수 있어요)"
        : "❌ 인식된 모델이 없습니다. 순서를 확인하거나 ↩ 되먹임을 켜 보세요.") + trainLine;
    }
    relayoutDock();
  }

  // recurrent(되먹임) 여부가 레시피와 일치해야 인식.
  //   레시피에 recurrent: true  → 벨트 되먹임이 켜져 있을 때만
  //   레시피에 recurrent 없음/false → 되먹임이 꺼져 있을 때만
  //   레시피에 train: [slug...] 있으면 학습 방법 칸이 그 slug 들을 모두 포함해야 함 (없으면 무시).
  function recognizeCombine(seq, recurrent, trainIds) {
    if (!seq.length) return null;
    recurrent = !!recurrent;
    var trainSet = {};
    (trainIds || []).forEach(function (x) { trainSet[x] = true; });
    function trainOk(r) {
      return !Array.isArray(r.train) || r.train.every(function (x) { return trainSet[x]; });
    }
    var exact = RECIPES.find(function (r) {
      return !!r.recurrent === recurrent && trainOk(r) &&
        Array.isArray(r.sequence) && arrEq(r.sequence, seq);
    });
    if (exact) return exact;
    return RECIPES.find(function (r) {
      return !!r.recurrent === recurrent && trainOk(r) &&
        Array.isArray(r.loose) && looseMatch(r.loose, seq);
    }) || null;
  }

  // loose 토큰이 belt 항목의 id / kind / layer 중 하나와 순서대로(부분수열) 매칭
  function looseMatch(tokens, seq) {
    var i = 0;
    for (var j = 0; j < seq.length && i < tokens.length; j++) {
      var n = byId[seq[j]] || {};
      if (tokens[i] === seq[j] || tokens[i] === n.kind || tokens[i] === n.layer) i++;
    }
    return i === tokens.length;
  }

  // ---- 합성 패널 ----
  function buildSynthPanel() {
    var panel = el("section", "lab-panel lab-synth");
    panel.hidden = true;
    panel.appendChild(el("h3", "lab-panel-title", "✦ 합성 — 개념을 상자에"));

    var box$ = el("div", "lab-box");
    wireDropzone(box$, function (id) {
      if (box.indexOf(id) === -1) box.push(id);
      renderBox();
    });
    panel.appendChild(box$);

    var actions = el("div", "lab-panel-actions");
    var fuse = el("button", "btn btn-primary btn-sm", "✦ 합성");
    var clr = el("button", "btn btn-outline-secondary btn-sm", "비우기");
    fuse.type = clr.type = "button";
    fuse.addEventListener("click", runSynth);
    clr.addEventListener("click", function () { box = []; renderBox(); result.innerHTML = ""; });
    actions.appendChild(fuse); actions.appendChild(clr);
    panel.appendChild(actions);

    var result = el("div", "lab-result");
    panel.appendChild(result);

    panel._box = box$;
    panel._result = result;
    return panel;

    function renderBox() {
      box$.innerHTML = "";
      box.forEach(function (id, i) {
        if (i > 0) box$.appendChild(el("span", "lab-plus", "+"));
        var n = byId[id];
        var s = el("span", "lab-slot", chipInner(n));
        s.title = "클릭하면 제거";
        s.addEventListener("click", function () { box.splice(i, 1); renderBox(); });
        box$.appendChild(s);
      });
      if (!box.length) box$.appendChild(el("span", "lab-empty", "개념을 여기로 드래그"));
      relayoutDock();
    }
  }

  function runSynth() {
    var panel = document.querySelector(".lab-synth");
    var out = panel._result;
    var hit = recognizeSynth(box);
    if (hit) {
      out.className = "lab-result is-hit";
      out.innerHTML = '✨ <a href="' + esc(resultUrl(hit.post)) + '">' +
        esc(resultTitle(hit.post, hit.label)) + '</a>';
    } else {
      out.className = "lab-result is-miss";
      out.textContent = "❌ 이 조합으로 나오는 개념이 없습니다.";
    }
    relayoutDock();
  }

  function recognizeSynth(ids) {
    if (!ids.length) return null;
    var set = {};
    ids.forEach(function (x) { set[x] = true; });
    var n = Object.keys(set).length;
    return SYNTH.find(function (r) {
      if (!Array.isArray(r.inputs) || !r.inputs.length) return false;
      var hasAll = r.inputs.every(function (x) { return set[x]; });
      if (!hasAll) return false;
      return r.loose ? true : r.inputs.length === n;
    }) || null;
  }

  function arrEq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // ---- 조립 ----
  function render() {
    root.innerHTML = "";

    // (2) 토글 버튼을 맨 위로
    var toggles = el("div", "lab-toggles");
    var tC = el("button", "btn btn-outline-primary btn-sm", "＋ 조합 작업대");
    var tS = el("button", "btn btn-outline-primary btn-sm", "＋ 합성 작업대");
    tC.type = tS.type = "button";
    toggles.appendChild(tC); toggles.appendChild(tS);
    root.appendChild(toggles);

    root.appendChild(buildDashboard());

    // (3) 조합/합성 패널을 화면 하단 고정 도크로.
    //     transform 걸린 조상(모바일 사이드바) 밑에서 fixed 가 깨지지 않도록 body 직속.
    var old = document.getElementById("lab-dock");
    if (old) old.remove();
    var dock = el("div", "lab-dock");
    dock.id = "lab-dock";

    var combine = buildCombinePanel();
    var synth = buildSynthPanel();
    dock.appendChild(combine);
    dock.appendChild(synth);
    document.body.appendChild(dock);

    // 패널마다 ✕ 닫기 버튼
    [combine, synth].forEach(function (p) {
      var x = el("button", "lab-dock-close", "✕");
      x.type = "button";
      x.setAttribute("aria-label", "작업대 닫기");
      x.addEventListener("click", function () { setOpen(null); });
      p.querySelector(".lab-panel-title").appendChild(x);
    });

    function syncDockPadding() {
      var open = dock.querySelector(".lab-panel:not([hidden])");
      root.style.paddingBottom = open ? (open.offsetHeight + 24) + "px" : "";
    }

    function setOpen(which) {
      var openC = which === "combine";
      var openS = which === "synth";
      combine.hidden = !openC;
      synth.hidden = !openS;
      tC.textContent = openC ? "－ 조합 작업대 닫기" : "＋ 조합 작업대";
      tS.textContent = openS ? "－ 합성 작업대 닫기" : "＋ 합성 작업대";
      tC.classList.toggle("is-on", openC);
      tS.classList.toggle("is-on", openS);
      dock.classList.toggle("is-open", openC || openS);
      root.classList.toggle("lab-dock-open", openC || openS);
      syncDockPadding();
    }

    tC.addEventListener("click", function () { setOpen(combine.hidden ? "combine" : null); });
    tS.addEventListener("click", function () { setOpen(synth.hidden ? "synth" : null); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dock.classList.contains("is-open")) setOpen(null);
    });
    window.addEventListener("resize", syncDockPadding);

    // 초기 렌더
    combine._slots.appendChild(el("span", "lab-empty", "부품을 여기로 드래그"));
    combine._train.appendChild(el("span", "lab-empty", "학습 방법을 여기로 (선택)"));
    synth._box.appendChild(el("span", "lab-empty", "개념을 여기로 드래그"));
    setOpen(null);
  }

  if (!NOTES.length) {
    root.innerHTML = '<p class="lab-empty-notice">아직 조합·합성할 노트가 없습니다. ' +
      '글 frontmatter 에 <code>combinable: true</code> 또는 <code>synthesizable: true</code> 를 추가하세요.</p>';
    return;
  }

  render();
})();
