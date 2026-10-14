/* HOTEASIK · 카드팩 홈 — _posts 폴더 구조 = 팩 트리, 글 = 카드 */
(function () {
  const $root = document.getElementById("cardpack");
  if (!$root) return;

  const $wrap = document.getElementById("cp-packs-wrap");
  const $packs = document.getElementById("cp-packs");
  const $hand = document.getElementById("cp-hand");
  const $detail = document.getElementById("cp-detail");
  const $nav = document.getElementById("cp-nav");
  const $dash = document.getElementById("cp-dashboard");
  const DEFAULT_COLOR = "#22e0ff";
  const reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const dur = ms => reduceMotion ? 0 : ms;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  function showMessage(msg) {
    $packs.innerHTML = `<div class="cp-empty">${esc(msg)}<br><a href="${esc($root.dataset.blog || "/blog/")}">블로그에서 글 보기 →</a></div>`;
  }

  // ── 데이터 읽기 ──
  let posts, meta;
  try {
    posts = JSON.parse(document.getElementById("cardpack-posts").textContent);
    meta = JSON.parse(document.getElementById("cardpack-meta").textContent);
    if (!Array.isArray(posts)) throw new Error("글 데이터 형식 오류");
  } catch (err) {
    console.error("[cardpack]", err);
    showMessage("카드팩 데이터를 불러오지 못했습니다.");
    return;
  }
  if (!meta || typeof meta !== "object") meta = {};
  const metaOf = name => (meta[name] && typeof meta[name] === "object") ? meta[name] : {};

  // ── 폴더 경로로 팩 트리 구성 ──
  function makeNode(name, parent) {
    const m = metaOf(name);
    return { name, icon: m.icon || "📦", color: m.color || (parent && parent.color) || DEFAULT_COLOR,
             order: typeof m.order === "number" ? m.order : 99, children: {}, cards: [] };
  }
  const tree = makeNode("HOME");
  Object.keys(meta).forEach(k => { if (metaOf(k).top) tree.children[k] = makeNode(k, tree); });   // 글 없어도 표시할 상위 팩
  posts.forEach(p => {
    if (!p || !Array.isArray(p.f) || !p.f.length) return;
    p.t = p.t || "(제목 없음)";
    p.d = p.d || "";
    p.tags = Array.isArray(p.tags) ? p.tags : [];
    let n = tree;
    p.f.forEach(f => { n = n.children[f] || (n.children[f] = makeNode(f, n)); });
    n.cards.push(p);
  });

  // 팩은 하위 팩(packs) 또는 카드(cards)를 가짐. 둘 다 있으면 직속 글은 '기타' 팩으로. count = 하위 전체 글 수
  const ETC = Object.assign({ name: "기타", icon: "🗂️" }, metaOf("_etc"));
  function finalize(n) {
    const subs = Object.values(n.children).sort((a, b) => a.order - b.order).map(finalize);
    const pack = { name: n.name, icon: n.icon, color: n.color };
    if (!subs.length) return Object.assign(pack, { cards: n.cards, count: n.cards.length });
    if (n.cards.length) {
      const name = subs.some(s => s.name === ETC.name) ? `${ETC.name} (직속)` : ETC.name;
      subs.push({ name, icon: ETC.icon, color: ETC.color || n.color, cards: n.cards, count: n.cards.length });
    }
    return Object.assign(pack, { packs: subs, count: subs.reduce((s, x) => s + x.count, 0) });
  }
  const ROOT = finalize(tree);
  if (!ROOT.packs) { showMessage("아직 표시할 글이 없습니다."); return; }

  // ── 상태 ──
  const path = [];          // 현재까지 연 팩 경로
  let handOpen = false, busy = false, pending = 0, lastFocus = null;
  function lock(ms) { busy = true; setTimeout(() => busy = false, dur(ms)); }
  function later(fn, ms) { clearTimeout(pending); pending = setTimeout(fn, dur(ms)); }
  function setPacksHidden(hidden) {
    $packs.classList.toggle("hidden", hidden);
    $wrap.classList.toggle("hidden", hidden);
  }

  const cardIcon = (c, p) => {
    const fallback = esc(c.emoji || p.icon);
    return c.icon ? `<img src="${esc(c.icon)}" alt="" data-fallback="${fallback}">` : fallback;
  };

  // 팩 아래 모든 카드를 {c, p(카드가 속한 팩)} 형태로 수집
  function collect(p) {
    return p.cards ? p.cards.map(c => ({ c, p })) : p.packs.flatMap(collect);
  }

  // ── 주소(#AI/부품)로 위치 기억 ──
  function saveHash() {
    const h = path.map(p => encodeURIComponent(p.name)).join("/");
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }
  function restoreHash() {
    path.length = 0;
    let list = ROOT.packs;
    for (const s of location.hash.slice(1).split("/").filter(Boolean)) {
      let name;
      try { name = decodeURIComponent(s); } catch (e) { break; }
      const p = list && list.find(x => x.name === name);
      if (!p || (!p.packs && !p.cards.length)) break;
      path.push(p);
      if (!p.packs) break;
      list = p.packs;
    }
  }

  function renderDashboard(top) {
    const items = collect(top);
    const tags = {};
    items.forEach(({ c }) => c.tags.forEach(t => tags[t] = (tags[t] || 0) + 1));
    const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(1, ...top.packs.map(sp => sp.count));
    const recent = [...items].sort((a, b) => b.c.d.localeCompare(a.c.d)).slice(0, 2);
    $dash.style.setProperty("--c", top.color);
    $dash.innerHTML = `
      <div class="cp-panel cp-stat"><div class="v">${items.length}</div><div class="l">글</div></div>
      <div class="cp-panel cp-stat"><div class="v">${top.packs.length}</div><div class="l">하위 분야</div></div>
      <div class="cp-panel cp-stat"><div class="v">${Object.keys(tags).length}</div><div class="l">태그</div></div>
      <div class="cp-panel cp-stat"><div class="v">${recent[0] && recent[0].c.d ? recent[0].c.d.slice(0, 4) : "-"}</div><div class="l">최근 활동</div></div>
      <div class="cp-panel cp-wide cp-rows2"><h3>분야별 글</h3>
        <div class="cp-barplot">${top.packs.map(sp => `
          <div class="cp-bar-col" title="${esc(sp.name)}: ${sp.count}개"><span class="n">${sp.count}</span>
            <div class="cp-bar" style="--c:${esc(sp.color)};height:${sp.count / max * 100}%"></div></div>`).join("")}</div>
        <div class="cp-bar-labels">${top.packs.map(sp => `<span title="${esc(sp.name)}">${esc(sp.icon)} ${esc(sp.name)}</span>`).join("")}</div>
      </div>
      <div class="cp-panel cp-wide"><h3>태그</h3>
        <div class="cp-chips">${topTags.map(([t, n]) => `<span>${esc(t)}<em>${n}</em></span>`).join("")}</div>
      </div>
      <div class="cp-panel cp-wide"><h3>최근 글</h3>
        <ul class="cp-recent">${recent.map((r, i) => `<li data-i="${i}" tabindex="0" role="button"><span>${esc(r.c.t)}</span><span class="when">${esc(r.p.name)} · ${esc(r.c.d)}</span></li>`).join("")}</ul>
      </div>`;
    $dash.querySelectorAll(".cp-recent li").forEach(li => li.onclick = () => { const r = recent[li.dataset.i]; openCard(r.c, r.p); });
  }

  function updateNav() {
    const cur = path[path.length - 1];
    $nav.classList.toggle("show", path.length > 0);
    $root.classList.toggle("sub", path.length > 0);
    if (cur && cur.packs) renderDashboard(cur);
    document.getElementById("cp-crumb").innerHTML =
      ["HOME", ...path.map(p => esc(p.name))].map((n, i, a) => i === a.length - 1 ? `<b>${n}</b>` : n).join(" › ");
    document.getElementById("cp-level-title").textContent = cur ? `${cur.icon} ${cur.name}` : "";
    saveHash();
  }

  // ── 팩 목록. origin이 있으면 그 위치(눌린 팩)에서 튀어나오듯 펼침 ──
  function renderPacks(list, origin) {
    $packs.innerHTML = "";
    $packs.scrollLeft = 0;
    const parent = path[path.length - 1];
    list.forEach(p => {
      const el = document.createElement("div");
      const empty = !p.packs && !p.cards.length;
      el.className = "cp-pack" + (empty ? " empty" : "");
      el.style.setProperty("--c", p.color);
      const count = p.packs ? `${p.packs.length} PACKS` : empty ? "COMING SOON" : `${p.cards.length} CARDS`;
      el.innerHTML = `<div class="face">${parent ? `<div class="parent">${esc(parent.name)}</div>` : ""}
        <div class="icon">${esc(p.icon)}</div><div class="name">${esc(p.name)}</div><div class="count">${count}</div></div>`;
      if (empty) el.setAttribute("aria-disabled", "true");
      else {
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", `${p.name} 팩 열기`);
        el._pack = p;
      }
      $packs.appendChild(el);
    });
    setPacksHidden(false);
    updateCarousel();
    if (!origin || reduceMotion) return;
    [...$packs.children].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - (r.left + r.width / 2);
      const dy = origin.top + origin.height / 2 - (r.top + r.height / 2);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px) scale(.5)`;
      el.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = "";
        el.style.transitionDelay = `${i * 90}ms`;
        el.style.transform = "";
        el.style.opacity = "";
        setTimeout(() => el.style.transitionDelay = "", 600 + i * 90);
      }));
    });
  }

  function selectPack(p, el) {
    if (busy) return;
    lock(450);
    const rect = el.getBoundingClientRect();
    path.push(p);
    updateNav();
    setPacksHidden(true);
    if (p.packs) later(() => renderPacks(p.packs, rect), 300);
    else { $dash.classList.add("hidden"); openHand(p, rect); }
  }

  function goBack() {
    if (busy || !path.length) return;
    lock(450);
    closeCard();
    const wasHand = handOpen;
    if (handOpen) closeHand();
    path.pop();
    updateNav();
    $dash.classList.remove("hidden");
    setPacksHidden(true);
    later(() => renderPacks(path.length ? path[path.length - 1].packs : ROOT.packs), wasHand ? 400 : 300);
  }

  // 애니메이션 없이 현재 path 상태로 그림 (주소로 진입/변경 시)
  function showCurrent() {
    clearTimeout(pending);
    $hand.innerHTML = "";
    handOpen = false;
    const cur = path[path.length - 1];
    updateNav();
    if (cur && !cur.packs) {
      $dash.classList.add("hidden");
      setPacksHidden(true);
      openHand(cur, null);
    } else {
      $dash.classList.remove("hidden");
      renderPacks(cur ? cur.packs : ROOT.packs);
    }
  }

  // ── 손에 편 카드 ──
  function fanTransform(i, n) {
    const spread = Math.min(window.innerWidth < 600 ? 9 : 12, 80 / Math.max(n - 1, 1));
    const angle = (i - (n - 1) / 2) * spread;
    return `translateY(-${window.innerHeight * 0.18}px) rotate(${angle}deg)`;
  }

  function openHand(p, r) {
    handOpen = true;
    const n = p.cards.length;
    const start = r
      ? `translate(${r.left + r.width / 2 - window.innerWidth / 2}px, ${r.top - window.innerHeight + 40 + r.height}px) scale(.6)`   // 팩 위치에서 시작
      : "translateY(300px) scale(.6)";
    p.cards.forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "cp-card";
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", c.t);
      el.style.setProperty("--c", p.color);
      el.innerHTML = `<div class="tag">${esc(p.name)}</div><div class="emoji">${cardIcon(c, p)}</div>
        <div class="title">${esc(c.t)}</div><div class="sub">${esc(c.tags.slice(0, 2).join(" · ") || c.d)}</div>`;
      el.style.transform = start;
      el.style.zIndex = i;
      el.onmouseenter = el.onfocus = () => el.style.transform = fanTransform(i, n) + " translateY(-40px) scale(1.08)";
      el.onmouseleave = el.onblur = () => el.style.transform = fanTransform(i, n);
      el.onclick = () => openCard(c, p);
      $hand.appendChild(el);
      setTimeout(() => { if (el.isConnected) el.style.transform = fanTransform(i, n); }, dur(60 + i * 80));   // 순서대로 펼침
    });
  }

  function closeHand() {
    handOpen = false;
    const cards = $hand.querySelectorAll(".cp-card");
    cards.forEach(el => el.style.transform = "translateY(300px) scale(.6)");
    setTimeout(() => cards.forEach(el => el.remove()), dur(400));
  }

  // ── 카드 상세 ──
  function openCard(c, p) {
    lastFocus = document.activeElement;
    $detail.style.setProperty("--c", p.color);
    document.getElementById("cp-detail-back").innerHTML = cardIcon(c, p);
    document.getElementById("cp-detail-front").innerHTML = `
      <button type="button" class="cp-close" aria-label="닫기">✕</button>
      <div class="tag">${(path.includes(p) ? path : [...path, p]).map(x => esc(x.name)).join(" › ")}</div>
      <h2>${esc(c.t)}</h2>
      <div class="period">${esc(c.d)}</div>
      <div class="stack">${c.tags.map(s => `<span>${esc(s)}</span>`).join("")}</div>
      ${c.img ? `<img class="media" src="${esc(c.img)}" alt="">` : ""}
      <p>${esc(c.x)}</p>
      <a class="read" href="${esc(c.u)}">글 읽기 →</a>`;
    $detail.querySelector(".cp-close").onclick = closeCard;
    $detail.classList.add("open");
    $detail.querySelector(".cp-close").focus({ preventScroll: true });
  }

  function closeCard() {
    if (!$detail.classList.contains("open")) return;
    $detail.classList.remove("open");
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  // ── 팩이 한 줄을 넘으면 가로 캐러셀 (드래그 · 화살표 · 가운데 강조) ──
  function updateCarousel() {
    $packs.classList.remove("carousel");
    const kids = $packs.children;
    const wraps = kids.length > 1 && kids[kids.length - 1].offsetTop > kids[0].offsetTop;
    $packs.classList.toggle("carousel", wraps);
    $wrap.classList.toggle("carousel", wraps);
    if (wraps) updateFocus();
  }
  function centerOf(el) { return el.offsetLeft + el.offsetWidth / 2 - $packs.clientWidth / 2; }
  function nearest() {
    let best = null, bestD = Infinity;
    for (const el of $packs.children) {
      const d = Math.abs(centerOf(el) - $packs.scrollLeft);
      if (d < bestD) { bestD = d; best = el; }
    }
    return best;
  }
  function updateFocus() {
    const best = nearest();
    for (const el of $packs.children) el.classList.toggle("focus", el === best);
  }
  function scrollToPack(el) {
    if (el) $packs.scrollTo({ left: centerOf(el), behavior: reduceMotion ? "auto" : "smooth" });
  }
  let scrollRaf = 0;
  $packs.addEventListener("scroll", () => {
    if (scrollRaf || !$packs.classList.contains("carousel")) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateFocus(); });
  }, { passive: true });
  document.getElementById("cp-prev").onclick = () => { const f = nearest(); scrollToPack(f && f.previousElementSibling); };
  document.getElementById("cp-next").onclick = () => { const f = nearest(); scrollToPack(f && f.nextElementSibling); };

  // 마우스 드래그 (터치는 브라우저 기본 스크롤)
  let drag = null, dragMoved = false;
  $packs.addEventListener("pointerdown", e => {
    dragMoved = false;
    if (e.pointerType !== "mouse" || e.button !== 0 || !$packs.classList.contains("carousel")) return;
    drag = { x: e.clientX, left: $packs.scrollLeft };
  });
  window.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!dragMoved && Math.abs(dx) < 6) return;
    if (!dragMoved) { dragMoved = true; $packs.classList.add("dragging"); }
    $packs.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    if (!dragMoved) return;
    $packs.classList.remove("dragging");
    scrollToPack(nearest());
    setTimeout(() => dragMoved = false, 0);      // 드래그 직후 click 은 무시
  });
  $packs.addEventListener("click", e => {
    if (dragMoved) { e.stopPropagation(); e.preventDefault(); return; }
  }, true);
  $packs.addEventListener("click", e => {
    const el = e.target.closest(".cp-pack");
    if (el && el._pack) selectPack(el._pack, el);
  });

  // ── 이벤트 ──
  document.getElementById("cp-back").onclick = goBack;
  $detail.onclick = e => { if (e.target === $detail) closeCard(); };

  // 이미지 로드 실패 → 대표 이미지는 숨기고 아이콘은 emoji/팩 아이콘으로 대체
  $root.addEventListener("error", e => {
    const img = e.target;
    if (!img || img.tagName !== "IMG") return;
    if (img.classList.contains("media")) img.remove();
    else img.replaceWith(document.createTextNode(img.dataset.fallback || "📦"));
  }, true);

  // Enter / Space 로 팩·카드·최근 글 열기
  $root.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".cp-pack[role=button], .cp-card, .cp-recent li")) {
      e.preventDefault();
      e.target.click();
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if ($detail.classList.contains("open")) closeCard(); else goBack();
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!$packs.classList.contains("hidden")) updateCarousel();
      if (!handOpen) return;
      const cards = $hand.querySelectorAll(".cp-card");
      cards.forEach((el, i) => el.style.transform = fanTransform(i, cards.length));
    }, 150);
  });

  window.addEventListener("hashchange", () => { closeCard(); restoreHash(); showCurrent(); });

  restoreHash();
  showCurrent();
})();
