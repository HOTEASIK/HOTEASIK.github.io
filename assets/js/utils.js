/* ===== HOTEASIK — 공용 유틸 (app.js / factory.js / graph.js가 같이 씀) ===== */
(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 속성값에 넣을 때도 동일한 이스케이프면 충분 (별도 이름은 호출부 의도를 드러내기 위함)
  function escapeAttr(s) { return escapeHtml(s); }

  // querySelector('[data-id="..."]')에 넣을 값 이스케이프
  function cssEscapeAttr(s) { return String(s).replace(/["\\]/g, "\\$&"); }

  function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

  // "---\nkey: val\n---\n본문" 형태의 아주 단순한 frontmatter 파서
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

  // frontmatter의 "[a, b, c]" 또는 "a, b, c" 형태를 배열로
  function toArray(val) {
    if (!val) return [];
    var s = String(val).trim();
    if (s.charAt(0) === "[" && s.charAt(s.length - 1) === "]") s = s.slice(1, -1);
    return s.split(",").map(function (x) {
      return x.trim().replace(/^["']|["']$/g, "");
    }).filter(Boolean);
  }

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (!seen[v]) { seen[v] = true; out.push(v); } });
    return out;
  }

  window.HoteasikUtils = {
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    cssEscapeAttr: cssEscapeAttr,
    truncate: truncate,
    parseFrontmatter: parseFrontmatter,
    toArray: toArray,
    uniq: uniq,
  };
})();
