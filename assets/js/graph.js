/* ===== HOTEASIK — 그래프 뷰 (글 · 부품 창고 트리를 한 SVG에 그리는 단일 렌더러) =====
   app.js는 { posts }만 넘겨서 글끼리 백링크만 있는 그래프를 그리고(초기 페인트),
   factory.js는 부품 트리까지 갖춰지면 { posts, tree, parts, partsById, recipes }를
   넘겨서 같은 함수로 다시 그린다. 레이아웃/엣지 계산 코드가 한 곳에만 있다. */
(function () {
  "use strict";

  var truncate = window.HoteasikUtils.truncate;
  var NS = "http://www.w3.org/2000/svg";

  function partsUsedByRecipe(recipe, parts) {
    if (recipe.sequence) return window.HoteasikUtils.uniq(recipe.sequence);
    if (recipe.loosePattern) {
      var byCategory = {};
      parts.forEach(function (p) {
        (byCategory[p.category] = byCategory[p.category] || []).push(p.id);
      });
      var ids = [];
      recipe.loosePattern.forEach(function (cat) {
        (byCategory[cat] || []).forEach(function (id) { ids.push(id); });
      });
      return window.HoteasikUtils.uniq(ids);
    }
    return [];
  }

  // 트리를 방사형으로 배치: 폴더 → 하위 폴더/부품 순으로 각도를 나눠 가짐
  function layoutTree(tree, cx, cy, positions) {
    var kids = tree.children || [];
    var span = (Math.PI * 2) / Math.max(kids.length, 1);
    kids.forEach(function (child, i) {
      layoutNode(child, -Math.PI / 2 + i * span, -Math.PI / 2 + (i + 1) * span, 0, positions, cx, cy);
    });
  }

  function layoutNode(node, angleStart, angleEnd, depth, positions, cx, cy) {
    var mid = (angleStart + angleEnd) / 2;
    var r = 16 + depth * 21;
    positions[node.gkey] = { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid) };
    var kids = node.children || [];
    if (kids.length) {
      var span = (angleEnd - angleStart) / kids.length;
      kids.forEach(function (c, i) {
        layoutNode(c, angleStart + i * span, angleStart + (i + 1) * span, depth + 1, positions, cx, cy);
      });
    }
  }

  /**
   * data: { posts, tree?, parts?, partsById?, recipes? } — tree가 없으면 글끼리 백링크만 그림.
   * handlers: { onOpenPost(id), onOpenPart(id), onFocusFolder(gkey) }
   */
  function render(svg, data, handlers) {
    var posts = data.posts || [];
    var tree = data.tree || null;
    var parts = data.parts || [];
    var partsById = data.partsById || {};
    var recipes = data.recipes || [];
    handlers = handlers || {};

    svg.innerHTML = "";
    if (!posts.length && !tree) return;

    var cx = 120, cy = tree ? 82 : 85;
    var positions = {};
    if (tree) layoutTree(tree, cx, cy, positions);

    var postR = tree ? 74 : 60;
    posts.forEach(function (p, i) {
      var angle = (i / posts.length) * Math.PI * 2 - Math.PI / 2;
      positions["post:" + p.id] = { x: cx + postR * Math.cos(angle), y: cy + postR * Math.sin(angle) };
    });

    var edges = [];
    var seenEdge = {};

    if (tree) {
      (function walk(node) {
        (node.children || []).forEach(function (child) {
          edges.push({ a: node.gkey, b: child.gkey, kind: "tree" });
          walk(child);
        });
      })(tree);
    }

    // 글끼리 백링크
    posts.forEach(function (p) {
      (p.links || []).forEach(function (targetId) {
        if (!posts.some(function (pp) { return pp.id === targetId; })) return;
        var key = ["post:" + p.id, "post:" + targetId].sort().join("|");
        if (seenEdge[key]) return;
        seenEdge[key] = true;
        edges.push({ a: "post:" + p.id, b: "post:" + targetId, kind: "post" });
      });
    });

    if (tree) {
      // 레시피가 쓰는 부품 → 완성되는 글
      recipes.forEach(function (recipe) {
        if (!recipe.postId) return;
        partsUsedByRecipe(recipe, parts).forEach(function (partId) {
          var part = partsById[partId];
          if (!part) return;
          var key = "part:" + part.path + "|post:" + recipe.postId;
          if (seenEdge[key]) return;
          seenEdge[key] = true;
          edges.push({ a: "part:" + part.path, b: "post:" + recipe.postId, kind: "recipe" });
        });
      });

      // 부품 자신이 postId를 갖고 있으면(예: 완성 구조 부품) 그 글로 바로 연결
      parts.forEach(function (part) {
        if (!part.postId || !posts.some(function (pp) { return pp.id === part.postId; })) return;
        var key = "part:" + part.path + "|post:" + part.postId;
        if (seenEdge[key]) return;
        seenEdge[key] = true;
        edges.push({ a: "part:" + part.path, b: "post:" + part.postId, kind: "recipe" });
      });
    }

    var frag = document.createDocumentFragment();

    edges.forEach(function (e) {
      var a = positions[e.a], b = positions[e.b];
      if (!a || !b) return;
      var line = document.createElementNS(NS, "line");
      line.setAttribute("x1", a.x);
      line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x);
      line.setAttribute("y2", b.y);
      line.setAttribute("class", "graph-edge" + (e.kind === "recipe" ? " graph-edge-recipe" : ""));
      frag.appendChild(line);
    });

    if (tree) {
      (function walk(node) {
        var pos = positions[node.gkey];
        if (pos) {
          frag.appendChild(node.type === "folder"
            ? makeFolderNode(node, pos, handlers)
            : makePartNode(node.part, pos, handlers));
        }
        (node.children || []).forEach(walk);
      })(tree);
    }

    posts.forEach(function (p) {
      var pos = positions["post:" + p.id];
      if (pos) frag.appendChild(makePostNode(p, pos, handlers));
    });

    svg.appendChild(frag);
  }

  function makeFolderNode(node, pos, handlers) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "graph-node is-folder");
    g.dataset.gkey = node.gkey;
    var rect = document.createElementNS(NS, "rect");
    rect.setAttribute("x", pos.x - 5);
    rect.setAttribute("y", pos.y - 5);
    rect.setAttribute("width", 10);
    rect.setAttribute("height", 10);
    rect.setAttribute("rx", 2);
    var t = document.createElementNS(NS, "text");
    t.setAttribute("x", pos.x);
    t.setAttribute("y", pos.y + 13);
    t.setAttribute("text-anchor", "middle");
    t.textContent = truncate(node.label, 8);
    g.appendChild(rect);
    g.appendChild(t);
    g.addEventListener("click", function () {
      if (handlers.onFocusFolder) handlers.onFocusFolder(node.gkey);
    });
    return g;
  }

  function makePartNode(p, pos, handlers) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "graph-node is-part" + (p.recurrent ? " is-recurrent" : ""));
    g.dataset.id = p.id;
    g.dataset.type = "part";
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", pos.x);
    c.setAttribute("cy", pos.y);
    c.setAttribute("r", 4);
    var t = document.createElementNS(NS, "text");
    t.setAttribute("x", pos.x);
    t.setAttribute("y", pos.y + 12);
    t.setAttribute("text-anchor", "middle");
    t.textContent = truncate(p.label, 8);
    g.appendChild(c);
    g.appendChild(t);
    g.addEventListener("click", function () {
      if (handlers.onOpenPart) handlers.onOpenPart(p.id);
    });
    return g;
  }

  function makePostNode(p, pos, handlers) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "graph-node");
    g.dataset.id = p.id;
    g.dataset.type = "post";
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", pos.x);
    c.setAttribute("cy", pos.y);
    c.setAttribute("r", 5.5);
    var t = document.createElementNS(NS, "text");
    t.setAttribute("x", pos.x);
    t.setAttribute("y", pos.y + 13);
    t.setAttribute("text-anchor", "middle");
    t.textContent = truncate(p.title, 9);
    g.appendChild(c);
    g.appendChild(t);
    g.addEventListener("click", function () {
      if (handlers.onOpenPost) handlers.onOpenPost(p.id);
    });
    return g;
  }

  window.HoteasikGraph = { render: render };
})();
