/* HOTEASIK · 카드팩 홈 — _posts 폴더 구조 = 팩 트리, 글 = 카드 */
(function () {
  const $root = document.getElementById("cardpack");
  if (!$root) return;

  const posts = JSON.parse(document.getElementById("cardpack-posts").textContent);
  const meta = JSON.parse(document.getElementById("cardpack-meta").textContent) || {};
  const DEFAULT_COLOR = "#22e0ff";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  // 폴더 경로로 팩 트리 구성
  function makeNode(name, parent) {
    const m = meta[name] || {};
    return { name, icon: m.icon || "📦", color: m.color || (parent && parent.color) || DEFAULT_COLOR,
             order: m.order == null ? 99 : m.order, children: {}, cards: [] };
  }
  const tree = makeNode("HOME");
  Object.keys(meta).filter(k => meta[k].top).forEach(k => tree.children[k] = makeNode(k, tree));   // 글 없어도 표시할 상위 팩
  posts.forEach(p => {
    let n = tree;
    p.f.forEach(f => { n = n.children[f] || (n.children[f] = makeNode(f, n)); });
    n.cards.push(p);
  });
  // 팩은 하위 팩(packs) 또는 카드(cards)를 가짐. 둘 다 있으면 직속 글은 '기타' 팩으로
  function finalize(n) {
    const subs = Object.values(n.children).sort((a, b) => a.order - b.order).map(finalize);
    const pack = { name: n.name, icon: n.icon, color: n.color };
    if (!subs.length) return Object.assign(pack, { cards: n.cards });
    if (n.cards.length) subs.push({ name: "기타", icon: "🗂️", color: n.color, cards: n.cards });
    return Object.assign(pack, { packs: subs });
  }
  const PACKS = finalize(tree).packs || [];

  const $packs = document.getElementById("cp-packs");
  const $hand = document.getElementById("cp-hand");
  const $detail = document.getElementById("cp-detail");
  const $nav = document.getElementById("cp-nav");
  const $dash = document.getElementById("cp-dashboard");
  const path = [];          // 현재까지 연 팩 경로
  let handOpen = false;

  const cardIcon = (c, p) => c.icon ? `<img src="${esc(c.icon)}" alt="">` : esc(c.emoji || p.icon);

  // 팩 아래 모든 카드를 {c, p(카드가 속한 팩)} 형태로 수집
  function collect(p) {
    return p.cards ? p.cards.map(c => ({ c, p })) : p.packs.flatMap(collect);
  }

  function renderDashboard(top) {
    const items = collect(top);
    const tags = {};
    items.forEach(({ c }) => (c.tags || []).forEach(t => tags[t] = (tags[t] || 0) + 1));
    const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(...top.packs.map(sp => collect(sp).length));
    const recent = [...items].sort((a, b) => b.c.d.localeCompare(a.c.d)).slice(0, 2);
    $dash.style.setProperty("--c", top.color);
    $dash.innerHTML = `
      <div class="cp-panel cp-stat"><div class="v">${items.length}</div><div class="l">글</div></div>
      <div class="cp-panel cp-stat"><div class="v">${top.packs.length}</div><div class="l">하위 분야</div></div>
      <div class="cp-panel cp-stat"><div class="v">${Object.keys(tags).length}</div><div class="l">태그</div></div>
      <div class="cp-panel cp-stat"><div class="v">${recent[0] ? recent[0].c.d.slice(0, 4) : "-"}</div><div class="l">최근 활동</div></div>
      <div class="cp-panel cp-wide cp-rows2"><h3>분야별 글</h3>
        <div class="cp-barplot">${top.packs.map(sp => { const n = collect(sp).length; return `
          <div class="cp-bar-col" title="${esc(sp.name)}: ${n}개"><span class="n">${n}</span>
            <div class="cp-bar" style="--c:${sp.color};height:${n / max * 100}%"></div></div>`; }).join("")}</div>
        <div class="cp-bar-labels">${top.packs.map(sp => `<span title="${esc(sp.name)}">${esc(sp.icon)} ${esc(sp.name)}</span>`).join("")}</div>
      </div>
      <div class="cp-panel cp-wide"><h3>태그</h3>
        <div class="cp-chips">${topTags.map(([t, n]) => `<span>${esc(t)}<em>${n}</em></span>`).join("")}</div>
      </div>
      <div class="cp-panel cp-wide"><h3>최근 글</h3>
        <ul class="cp-recent">${recent.map((r, i) => `<li data-i="${i}"><span>${esc(r.c.t)}</span><span class="when">${esc(r.p.name)} · ${r.c.d}</span></li>`).join("")}</ul>
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
  }

  // 팩 목록 렌더링. origin이 있으면 그 위치(눌린 팩)에서 튀어나오듯 펼침
  function renderPacks(list, origin) {
    $packs.innerHTML = "";
    const parent = path[path.length - 1];
    list.forEach(p => {
      const el = document.createElement("div");
      el.className = "cp-pack";
      el.style.setProperty("--c", p.color);
      const empty = !p.packs && !p.cards.length;
      const count = p.packs ? `${p.packs.length} PACKS` : empty ? "COMING SOON" : `${p.cards.length} CARDS`;
      el.innerHTML = `<div class="face">${parent ? `<div class="parent">${esc(parent.name)}</div>` : ""}
        <div class="icon">${esc(p.icon)}</div><div class="name">${esc(p.name)}</div><div class="count">${count}</div></div>`;
      if (empty) el.classList.add("empty");
      else el.onclick = () => selectPack(p, el);
      $packs.appendChild(el);
    });
    $packs.classList.remove("hidden");
    if (!origin) return;
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
    const rect = el.getBoundingClientRect();
    path.push(p);
    updateNav();
    $packs.classList.add("hidden");
    if (p.packs) setTimeout(() => renderPacks(p.packs, rect), 300);
    else { $dash.classList.add("hidden"); openHand(p, rect); }
  }

  function goBack() {
    if (handOpen) closeHand();
    $dash.classList.remove("hidden");
    path.pop();
    updateNav();
    $packs.classList.add("hidden");
    const list = path.length ? path[path.length - 1].packs : PACKS;
    setTimeout(() => renderPacks(list), handOpen ? 400 : 300);
    handOpen = false;
  }

  function fanTransform(i, n) {
    const spread = Math.min(window.innerWidth < 600 ? 9 : 12, 80 / Math.max(n - 1, 1));
    const angle = (i - (n - 1) / 2) * spread;
    return `translateY(-${window.innerHeight * 0.18}px) rotate(${angle}deg)`;
  }

  function openHand(p, r) {
    handOpen = true;
    const startX = r.left + r.width / 2 - window.innerWidth / 2;
    const startY = r.top - window.innerHeight + 40 + r.height;
    p.cards.forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "cp-card";
      el.style.setProperty("--c", p.color);
      el.innerHTML = `<div class="tag">${esc(p.name)}</div><div class="emoji">${cardIcon(c, p)}</div>
        <div class="title">${esc(c.t)}</div><div class="sub">${esc((c.tags || []).slice(0, 2).join(" · ") || c.d)}</div>`;
      el.style.transform = `translate(${startX}px, ${startY}px) scale(.6)`;   // 팩 위치에서 시작
      el.style.zIndex = i;
      const fan = fanTransform(i, p.cards.length);
      el.onmouseenter = () => el.style.transform = fan + " translateY(-40px) scale(1.08)";
      el.onmouseleave = () => el.style.transform = fan;
      el.onclick = () => openCard(c, p);
      $hand.appendChild(el);
      setTimeout(() => el.style.transform = fan, 60 + i * 80);       // 순서대로 펼침
    });
  }

  function closeHand() {
    const cards = $hand.querySelectorAll(".cp-card");
    cards.forEach(el => el.style.transform = "translateY(300px) scale(.6)");
    setTimeout(() => cards.forEach(el => el.remove()), 400);
  }

  function openCard(c, p) {
    $detail.style.setProperty("--c", p.color);
    document.getElementById("cp-detail-back").innerHTML = cardIcon(c, p);
    document.getElementById("cp-detail-front").innerHTML = `
      <button type="button" class="cp-close">✕</button>
      <div class="tag">${(path.includes(p) ? path : [...path, p]).map(x => esc(x.name)).join(" › ")}</div>
      <h2>${esc(c.t)}</h2>
      <div class="period">${c.d}</div>
      <div class="stack">${(c.tags || []).map(s => `<span>${esc(s)}</span>`).join("")}</div>
      ${c.img ? `<img class="media" src="${esc(c.img)}" alt="">` : ""}
      <p>${esc(c.x)}</p>
      <a class="read" href="${esc(c.u)}">글 읽기 →</a>`;
    $detail.querySelector(".cp-close").onclick = closeCard;
    $detail.classList.add("open");
  }

  function closeCard() { $detail.classList.remove("open"); }

  document.getElementById("cp-back").onclick = goBack;
  $detail.onclick = e => { if (e.target === $detail) closeCard(); };
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if ($detail.classList.contains("open")) closeCard(); else if (path.length) goBack();
  });

  renderPacks(PACKS);
})();
