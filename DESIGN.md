# HOTEASIK 재구축 설계 — Chirpy 기반

> cotes2020/jekyll-theme-chirpy (gem, `~> 7.6`) 위에 **카드팩 포트폴리오 홈**과 **조합·합성 랩**을 얹는다.
> 콘텐츠 모델은 **통합**: 모든 개념·부품·모델·프로젝트가 각각 하나의 글이고,
> `_posts/<상위팩>/<하위팩>/…/*.md` 의 폴더 구조가 곧 홈의 카드팩 구조다 (10장).

로컬에 Ruby가 없으므로 빌드·배포는 **GitHub Actions**(`.github/workflows/pages-deploy.yml`)가
전담한다. 로컬 미리보기는 Ruby 설치 후 `bundle exec jekyll s`.

---

## 1. 사이트 골격 (Chirpy)

| 파일 | 역할 |
|---|---|
| `Gemfile` | `jekyll-theme-chirpy ~> 7.6` + windows tzinfo/wdm |
| `_config.yml` | `lang: ko-KR`, 사이트 메타, giscus, `collections.tabs`, `jekyll-archives` |
| `.github/workflows/pages-deploy.yml` | Ruby 3.4 → `jekyll b` → htmlproofer → Pages 배포 |
| `_plugins/wikilink.rb` | 본문 `[[slug]]` / `[[slug|라벨]]` → 해당 글 링크로 치환 (CI 빌드에서 동작) |
| `_plugins/posts-lastmod-hook.rb` | Chirpy 표준 (git 기준 최종수정일) |
| `index.html` | `layout: home` — 홈(카드팩 포트폴리오) |
| `_data/packs.yml` | 카드팩 아이콘·색·순서·`top` (키 = `_posts` 폴더 이름) |
| `_tabs/lab.md` | `order: 1` — **조합 & 합성** |
| `_tabs/blog.md` | `order: 2` — **블로그**(전체 글 목록) |
| `_tabs/about.md` | `order: 3` — 소개 (선택) |

### 사이드바 네비게이션
Chirpy 사이드바는 **HOME(→ `/`)** 이 고정으로 있고 그 아래 `_tabs` 를 `order` 순으로 나열한다.

- **홈** = 고정 HOME → `index.html`: 카드팩 포트폴리오 (10장)
- **조합 & 합성** = `_tabs/lab.md`
- **블로그** = `_tabs/blog.md`

`categories` / `tags` / `archives` 탭은 만들지 않음(사이드바 최소화). 단, `jekyll-archives` 는
켜 두어 글 안의 카테고리·태그 링크(`/categories/…`, `/tags/…`)는 살아 있게 한다.

### 커스텀 레이아웃
| `_layouts/home.html` | 홈. `layout: default` 확장, 카드팩 컨테이너 + 글/팩 정보 JSON → `cardpack.js` |
| `_layouts/blog.html` | 블로그. `site.posts` 전체를 최신순 카드 리스트 (초기엔 페이지네이션 없음) |
| `_layouts/lab.html` | 조합&합성. 부품 대시보드 + 하단 소환식 조합/합성 패널 컨테이너 |

---

## 2. 통합 콘텐츠 모델 — "모든 것이 노트"

`_posts/<팩>/<하위팩>/YYYY-MM-DD-<slug>.md`. Chirpy 표준 frontmatter + **랩 전용 키**
(+ 카드팩용 선택 키 `emoji`, `image`, `description`):

```yaml
---
title: 합성곱
date: 2026-09-04 09:00:00 +0900
categories: [부품, 은닉층]      # Chirpy 그룹핑
tags: [conv]
layer: hidden                   # input | hidden | output | training | concept
kind: conv                      # 은닉층/학습방법 세부: activation, conv, recurrent,
                                #   loss, pooling, norm, attention, optimizer, regularization …
icon: /assets/parts/conv.svg    # 선택 (없으면 기본 톱니)
combinable: true                # 조합 뷰의 부품으로 노출
synthesizable: true             # 합성 뷰의 재료로 노출
weight: 2                       # 대시보드에서 차지하는 상대 비중(은닉층 종류는 크게)
---

본문(마크다운). `[[relu]]` 위키링크 가능.
```

- `layer` 값과 개수
  - `input` (입력층) — 소수
  - `hidden` (은닉층) — **가장 많음**, `kind` 로 다시 쪼갬 → 대시보드에서 세로 폭 크게
  - `output` (출력층) — 소수
  - `training` (학습방법) — 옵티마이저·손실함수·정규화기법·스케줄러 …
  - `eval` (평가방법) — 분류·회귀·검출·생성 지표. `kind` 로 쪼갬, 대시보드 폭 크게
  - `concept` — 신경망 층이 아닌 순수 개념(물리, 화학 등). 합성 전용 재료
  - `model` — 완성된 모델. 조합·합성의 결과 링크 대상
- 모델(LeNet-5, VLA 등)도 글이며 `layer` 없음, `categories: [모델]`

### Liquid → JS 데이터 전달
`_layouts/lab.html` 이 빌드시 아래를 JSON 으로 심는다.

```liquid
{% assign lab_posts = site.posts | where_exp: "p", "p.combinable or p.synthesizable" %}
<script type="application/json" id="lab-notes">
[
  {% for p in lab_posts %}
  {"id":"{{ p.slug }}","title":{{ p.title | jsonify }},"url":"{{ p.url | relative_url }}",
   "layer":"{{ p.layer }}","kind":"{{ p.kind }}","icon":"{{ p.icon | relative_url }}",
   "combinable":{{ p.combinable | default: false }},"synthesizable":{{ p.synthesizable | default: false }},
   "weight":{{ p.weight | default: 1 }}}{% unless forloop.last %},{% endunless %}
  {% endfor %}
]
</script>
{% assign recipes = site.data.recipes | jsonify %}
{% assign syntheses = site.data.syntheses | jsonify %}
<script>window.LAB_RECIPES = {{ recipes }}; window.LAB_SYNTH = {{ syntheses }};</script>
```

---

## 3. 조합 뷰 (Combination)

**목표**: 층별로 하위 부품을 넣어 하나의 모델/개념을 출력.

### 레이아웃 (`_layouts/lab.html` 하단, "조합" 버튼으로 소환)
```
┌ 부품 대시보드 (리스트) ─────────────────────────┐
│ 입력층   [input]                                  │
│ 은닉층   활성화 [relu][gelu…]  합성곱 [conv][inception]  │  ← 세로로 길게
│          순환 [rnn][lstm]  풀링 [pool][gap]  손실함수 …  │
│ 출력층   [softmax][linear-out]                    │
│ 학습방법 [sgd][adam][dropout][batchnorm]          │
└──────────────────────────────────────────────────┘
┌ 컨베이어 벨트 (조립대) ───────────────────────────┐
│  [input] → [conv] → [pool] → [conv] → … → [output]│  ← 드래그해서 순서대로
└──────────────────────────────────────────────────┘
        [ ⚙ 제작 ]   [ 초기화 ]
   결과: ✨ LeNet-5  → (글로 이동)
```

- 부품 칩을 벨트로 **드래그앤드롭**, 벨트 안에서 순서 이동, 클릭 시 제거
- `_data/recipes.yml`:
  ```yaml
  - id: lenet-5
    label: LeNet-5
    sequence: [input, conv, pool, conv, pool, fc, fc, output]   # 글 slug 배열
    post: lenet-5
    hint: 입력 → 합성곱 → 풀링 ×2 → 완전연결 ×2 → 출력
  - id: cnn
    label: CNN (일반형)
    loose: [input, conv, pool, fc]        # 이 kind/slug 가 이 순서로 한 번씩 등장하면 인식
    post: cnn
  ```
- 매칭: `sequence` 정확 일치 → 없으면 `loose` 부분수열(각 항목을 slug 또는 `kind` 로 대조)
- 결과 라벨이 `post` 글로 가는 링크. 그 글 상단에 이 시퀀스가 흐름도로 표시(레이아웃에서 렌더)

## 4. 합성 뷰 (Synthesis)

**목표**: N개 개념을 합쳐 상위 개념 하나 출력. `물리 + 화학 = 물리화학`, `llm + cnn + robotics = vla`.

### 레이아웃 ("합성" 버튼으로 소환)
```
┌ 재료 대시보드 (리스트, synthesizable 전부) ───────┐
│ [물리][화학][생물]  [llm][cnn][robotics][rl] …    │
└──────────────────────────────────────────────────┘
┌ 합성 상자 ────────────────┐
│   [ 물리 ] [ 화학 ]        │  ← 드래그앤드롭, 순서 무관
└──────────────────────────┘
        [ ✦ 합성 ]   [ 비우기 ]
   결과: ✨ 물리화학  → (글로 이동)
```
- `_data/syntheses.yml`:
  ```yaml
  - id: vla
    label: VLA
    inputs: [llm, cnn, robotics]     # 순서 무관 집합
    post: vla
  - id: mulli-hwahak
    label: 물리화학
    inputs: [physics, chemistry]
    post: physical-chemistry
  ```
- 매칭: 상자 안 slug 집합이 `inputs` 집합과 정확히 일치(옵션 `loose: true` 면 포함)
- 결과가 `post` 글로 링크

## 5. 랩 엔진 (`assets/js/lab.js`, `assets/css/lab.css`)

- 의존성 없음(vanilla). 구 `factory.js` 의 DnD·인식 로직을 이식
- `#lab-notes` JSON + `window.LAB_RECIPES` / `window.LAB_SYNTH` 로 동작
- 대시보드 = 리스트형(칩), `layer` → `kind` 순으로 그룹, `weight` 로 은닉층 강조
- 하단 "조합" / "합성" 토글 버튼 → 해당 패널을 아래에 펼침(둘 다 열 수 있음)
- 상태는 페이지 안에서만(새로고침 시 초기화). 결과 링크만 실제 이동

---

## 6. 콘텐츠 이관

기존 → 신규 (`_posts/2026-09-04-<slug>.md`):

| 기존 | slug | layer / kind | categories |
|---|---|---|---|
| `_parts/input/input` | `input` | input | [부품, 입력층] |
| `_parts/hidden/convolution/conv` | `conv` | hidden / conv | [부품, 은닉층] |
| `_parts/hidden/convolution/inception` | `inception` | hidden / conv | [부품, 은닉층] |
| `_parts/hidden/pooling/{pool,avgpool,gap}` | `pool`,`avgpool`,`gap` | hidden / pooling | [부품, 은닉층] |
| `_parts/hidden/dense/fc` | `fc` | hidden / dense | [부품, 은닉층] |
| `_parts/hidden/dense/dropout` | `dropout` | training / regularization | [부품, 학습방법] |
| `_parts/hidden/activation/relu` | `relu` | hidden / activation | [부품, 은닉층] |
| `_parts/hidden/recurrent/rnn` | `rnn` | hidden / recurrent | [부품, 은닉층] |
| `_parts/output/output` | `softmax-out` | output | [부품, 출력층] |
| `_parts/architectures/cnn` | `cnn` | — | [모델] |
| `_post/2026-09-04-*` (welcome, lenet-5, alexnet, vggnet, googlenet, cnn, rnn) | 그대로 | — | [모델] 또는 [메타] |
| 신규 | `llm`,`robotics`,`vla`,`physics`,`chemistry`,`physical-chemistry` | concept | [개념] |
| 신규(은닉층 보강) | `gelu`,`lstm`,`attention`,`batchnorm`,`layernorm` | hidden|training / … | |
| 신규(학습방법) | `sgd`,`adam`,`cross-entropy`,`mse` | training / optimizer·loss | [부품, 학습방법] |

- 위키링크 `[[id]]` 는 `_plugins/wikilink.rb` 가 처리 → 본문 수정 불필요
- 이후 카드팩 도입 때 49개 글을 `categories` 기준으로 `_posts/AI/<categories…>/` 로 이동
  (`AI/부품/<은닉층 등>`, `AI/모델`, `AI/개념`, `AI/메타`). URL·카테고리는 그대로
- 아이콘: 기존 `icon.svg` → `assets/parts/<slug>.svg` 로 이동, frontmatter `icon:` 로 참조

## 7. 제거

`index.html`(구 SPA), `assets/js/{app,factory,comments,utils}.js`, `assets/css/style.css`,
`_parts/`, `_post/`, `_data/changelog.json`, `tools/`, `IMPROVEMENTS.md`.
git 이력에 남으므로 복구 가능. (지난 세션 미커밋 작업은 이 재구축으로 대체됨)

카드팩 도입 시: 공장 지도 홈과 `assets/css/factory.css`, `assets/js/factory.js` 제거.

## 8. 배포 절차 (사용자)

1. GitHub 레포 **Settings → Pages → Source: GitHub Actions**
2. (댓글) Discussions 활성화 + giscus 앱 설치 + `_config.yml` giscus 4개 값 입력
3. `main` 에 push → Actions "Build and Deploy" 통과 시 `https://hoteasik.github.io` 반영
4. 로컬 미리보기(선택): RubyInstaller+DevKit → `gem install bundler` → `bundle` → `bundle exec jekyll s`

## 9. 구현 순서

1. Chirpy 골격: `Gemfile`, `_config.yml`, workflow, `.gitignore`, `_plugins/*`
2. `_data/locales` 는 gem 제공(ko-KR) — 불필요. `_data/{contact,share,recipes,syntheses}.yml`
3. 레이아웃 3종 + `index.html` + `_tabs/{lab,blog,about}.md`
4. `assets/js/lab.js` + `assets/css/lab.css` + `assets/parts/*.svg`
5. 콘텐츠 이관 `_posts/*.md` (표 6장)
6. 구 파일 제거
7. push → Actions 로그 보며 수정

---

## 10. 홈 — 카드팩 포트폴리오 (`_layouts/home.html`, `assets/js/cardpack.js`, `assets/css/cardpack.css`)

**목표**: 테마별 카드팩(ROBOTICS · AI · CODING)을 열어 → 하위 팩 → 카드(글)를 고르는 포트폴리오 홈.

### 팩 구조 = 폴더 구조
```
_posts/
  ROBOTICS/MANIPULATOR/2026-…-arm.md     → HOME › ROBOTICS › MANIPULATOR › 카드
  AI/부품/은닉층/2026-09-04-conv.md       → HOME › AI › 부품 › 은닉층 › 카드
  AI/모델/2026-09-04-lenet-5.md           → HOME › AI › 모델 › 카드
```
- 폴더 깊이 제한 없음. 하위 폴더가 있으면 팩, 없으면 카드 묶음
- 하위 폴더와 직속 글이 같이 있으면 직속 글은 `기타` 팩
  (`packs.yml` 의 `_etc: { name, icon }` 로 변경, 같은 이름 폴더가 있으면 `기타 (직속)`)
- `_posts` 바로 아래 글은 카드팩에서 제외
- `_data/packs.yml` 이 폴더 이름별 `icon` / `color` / `order` 지정. 없으면 📦 + 상위 팩 색
- `top: true` 팩은 글이 없어도 홈에 `COMING SOON`(흐림, 클릭 불가)

### 화면 흐름
```
① 홈: 상위 팩 나열
   [🤖 ROBOTICS] [🧠 AI] [💻 CODING]

② 하위 팩이 있는 팩 열기 → 눌린 팩 자리에서 하위 팩이 순서대로 튀어나옴
┌ 대시보드 ───────────────────────────────────────┐
│ [글 수] [하위 분야 수] [태그 수] [최근 활동 연도] │
│ ┌ 분야별 글 (세로 막대) ┐ ┌ 태그 Top 8 ──────┐ │
│ │  ▇   ▅   ▂          │ ├ 최근 글 2개 ─────┤ │
│ └──────────────────────┘ └──────────────────┘ │
└────────────────────────────────────────────────┘
          [하위팩] [하위팩] [하위팩]   ← 화면 하단

③ 카드만 있는 팩 열기 → 대시보드 숨김, 카드가 팩 위치에서 날아와 손에 쥔 부채꼴로 펼침
   (호버 시 위로 뽑힘, 카드 많으면 부채 각도 자동 축소)

④ 카드 클릭 → 뒤집히며 확대된 상세
   경로 · 제목 · 날짜 · 태그 칩 · 대표 이미지(image) · 요약 · [글 읽기 →]
```
- 좌상단 `← 뒤로` + 경로(`HOME › AI › 부품`), `ESC` = 상세 닫기 → 한 단계 뒤로
- 대시보드 최근 글 클릭 → 바로 카드 상세

### 팩이 많을 때 — 가로 캐러셀
```
 ‹   [팩]  [ 팩 ]  [팩]   ›      ← 가운데 팩 강조(scale 1.05), 나머지 흐림
```
- 팩이 한 줄에 다 안 들어가면(줄바꿈 발생) 자동 전환, 창 크기 변경 시 재판정
- 마우스 드래그(6px 이상 이동 = 드래그, 그 직후 click 무시) / 터치는 기본 스크롤 / `‹ ›` 버튼
- `scroll-snap` 으로 놓으면 가장 가까운 팩이 가운데로

### 위치 기억 — URL hash
- 현재 경로를 `#AI/부품/은닉층` 으로 저장(`history.replaceState`, 방문 기록은 늘리지 않음)
- 진입·`hashchange` 시 경로 복원(애니메이션 없이). 없는 이름·빈 팩에서 멈춤
- 글 읽고 뒤로가기 → 보던 팩으로 복귀, 특정 팩 링크 공유 가능

### 예외 처리
| 상황 | 처리 |
|---|---|
| 전환 애니메이션 중 연타·뒤로 | 0.45초 입력 잠금 + 대기 중 렌더 타이머 1개만 유지 |
| JSON 파싱 실패 / 글 0개 / JS 꺼짐 | 안내 문구 + `블로그에서 글 보기 →` (noscript 포함) |
| 제목·태그·날짜 누락, `packs.yml` 항목 형식 오류 | 기본값으로 대체 / 해당 항목 무시 |
| 제목 등에 `</script>` | Liquid 에서 `</` → `<\/` 치환 |
| `icon`·`image` 로드 실패 | 아이콘은 emoji → 팩 아이콘으로 대체, 대표 이미지는 숨김 |
| 카드 펼친 채 창 크기 변경·회전 | 150ms 디바운스 후 부채꼴 위치 재계산 |

### 접근성 · 성능
- 팩·카드·최근 글: `role=button` + `tabindex`, Enter/Space 로 열기, `:focus-visible` 흰 테두리
- 상세: `role=dialog`, 열면 닫기 버튼에 포커스, 닫으면 원래 요소로 복귀
- `prefers-reduced-motion: reduce` → 전환·뒤집기 애니메이션 0s, JS 지연도 0
- 팩별 글 수(`count`)는 트리 구성 시 한 번만 계산

### 시각 규칙
- 다크 패널(`#0d1117` / `#161b22`) + 팩 색 네온 테두리·글로우. 색은 팩(폴더)을 따름
- 막대그래프 막대 색 = 하위 팩 색, 값·라벨은 텍스트 색
- 카드 아이콘 우선순위: `icon`(SVG) → `emoji` → 팩 아이콘
- 클래스는 모두 `cp-` 접두어 (Chirpy/Bootstrap 의 `.card`·`.nav`·`.close` 등과 충돌 방지)
- 모바일(≤600px): 팩·카드 축소, 대시보드 2열, 캐러셀 가운데 정렬 폭(`--pw`)도 축소

### Liquid → JS 데이터 전달
`home.html` 이 빌드 시 `#cardpack-posts`(글 배열) / `#cardpack-meta`(`packs.yml`) JSON 을 심는다.
글마다 `{t 제목, u URL, d 날짜, f 폴더 배열, tags, x 요약, icon, emoji, img}`.
`f` 는 `post.path`(`_posts/AI/부품/은닉층/…md`)를 `/` 로 잘라 앞뒤를 뗀 값.
