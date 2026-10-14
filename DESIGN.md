# HOTEASIK 재구축 설계 — Chirpy 기반

> cotes2020/jekyll-theme-chirpy (gem, `~> 7.6`) 위에 **카드팩 포트폴리오 홈**과 **카드팩 스킨**을 얹는다.
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
| `_tabs/blog.md` | `order: 2` — **블로그**(전체 글 목록, 팩 경로·팩 색 카드) |
| `_tabs/categories.md` | `order: 4` — 카테고리 |
| `_tabs/about.md` | `order: 6` — 소개 |

### 사이드바 네비게이션
Chirpy 사이드바는 **HOME(→ `/`)** 이 고정으로 있고 그 아래 `_tabs` 를 `order` 순으로 나열한다.

- **홈** = 고정 HOME → `index.html`: 카드팩 포트폴리오 (10장)
- **블로그** = `_tabs/blog.md`
- **카테고리** = `_tabs/categories.md`
- **소개** = `_tabs/about.md`

`tags` / `archives` 탭은 두지 않음(사이드바 최소화). 단, `jekyll-archives` 는
켜 두어 글 안의 카테고리·태그 링크(`/categories/…`, `/tags/…`)는 살아 있게 한다.

### 커스텀 레이아웃
| `_layouts/home.html` | 홈. `layout: default` 확장, 카드팩 컨테이너 + 글/팩 정보 JSON → `cardpack.js` |
|---|---|

---

## 2. 통합 콘텐츠 모델 — "모든 것이 노트"

`_posts/<팩>/<하위팩>/YYYY-MM-DD-<slug>.md`. Chirpy 표준 frontmatter + 분류 키
(+ 카드팩용 선택 키 `emoji`, `image`, `description`):

```yaml
---
title: 합성곱
date: 2026-09-04 09:00:00 +0900
categories: [부품, 은닉층]      # Chirpy 그룹핑
tags: [conv]
layer: hidden                   # input | hidden | output | training | eval | concept | model | preprocess
kind: conv                      # 은닉층/학습방법 세부: activation, conv, recurrent,
                                #   loss, pooling, norm, attention, optimizer, regularization …
icon: /assets/parts/conv.svg    # 선택: 카드 아이콘
---

본문(마크다운). `[[relu]]` 위키링크 가능.
```

- `layer` 값
  - `input` (입력층) · `hidden` (은닉층, `kind` 로 다시 쪼갬) · `output` (출력층)
  - `training` (학습방법) — 옵티마이저·손실함수·정규화기법·스케줄러 …
  - `eval` (평가방법) — 분류·회귀·검출·생성 지표
  - `preprocess` (데이터 전처리) · `concept` (순수 개념) · `model` (완성된 모델)
- 모델(LeNet-5, VLA 등)도 글이며 `categories: [모델]`
- 기존 글에 남아 있는 `combinable` / `synthesizable` / `weight` 는 구 조합&합성 랩용 키로, 지금은 쓰이지 않음

## 3~5. (제거됨) 조합 & 합성 랩

드래그앤드롭으로 부품을 조합·합성하던 `/lab/` 은 카드팩 리디자인 때 제거했다
(`_tabs/lab.md`, `_layouts/lab.html`, `assets/{js,css}/lab.*`, `_data/{recipes,syntheses}.yml`).
git 이력에 남아 있어 복구 가능.

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

카드팩 스킨 적용 시: 조합 & 합성 랩 전체(3~5장), `_tabs/{archives,tags}.md`,
오른쪽 패널의 최근 업데이트·인기 태그(빈 include 오버라이드) 제거.

## 8. 배포 절차 (사용자)

1. GitHub 레포 **Settings → Pages → Source: GitHub Actions**
2. (댓글) Discussions 활성화 + giscus 앱 설치 + `_config.yml` giscus 4개 값 입력
3. `main` 에 push → Actions "Build and Deploy" 통과 시 `https://hoteasik.github.io` 반영
4. 로컬 미리보기(선택): RubyInstaller+DevKit → `gem install bundler` → `bundle` → `bundle exec jekyll s`

## 9. 구현 순서 (초기 재구축 당시 기록 — 랩 관련 항목은 이후 제거됨)

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
- 다크 패널(`#0d1117` / `#161b22`) + 팩 색 테두리·글로우. 색은 팩(폴더)을 따름 (사이트 전체 톤은 11장)
- 막대그래프 막대 색 = 하위 팩 색, 값·라벨은 텍스트 색
- 카드 아이콘 우선순위: `icon`(SVG) → `emoji` → 팩 아이콘
- 클래스는 모두 `cp-` 접두어 (Chirpy/Bootstrap 의 `.card`·`.nav`·`.close` 등과 충돌 방지)
- 모바일(≤600px): 팩·카드 축소, 대시보드 2열, 캐러셀 가운데 정렬 폭(`--pw`)도 축소

### Liquid → JS 데이터 전달
`home.html` 이 빌드 시 `#cardpack-posts`(글 배열) / `#cardpack-meta`(`packs.yml`) JSON 을 심는다.
글마다 `{t 제목, u URL, d 날짜, f 폴더 배열, tags, x 요약, icon, emoji, img}`.
`f` 는 `post.path`(`_posts/AI/부품/은닉층/…md`)를 `/` 로 잘라 앞뒤를 뗀 값.

---

## 11. 사이트 스킨 — 카드팩 톤 (`assets/css/jekyll-theme-chirpy.scss`)

**목표**: 홈 밖(글·목록·카테고리·소개)도 카드팩과 같은 톤. 구 사이버펑크(네온 시안/마젠타·격자·스캔라인·Orbitron) 폐기.

### 토큰
| 용도 | 값 |
|---|---|
| 배경 / 사이드바 / 패널 | `#0d1117` / `#010409` / `#161b22` |
| 테두리 / 약한 테두리 | `#30363d` / `#21262d` |
| 제목 / 본문 / 보조 | `#e6edf3` / `#c9d1d9` / `#8b949e` |
| 링크 | `#58a6ff` |
| 팩 색 (포인트) | ROBOTICS `#ff7b3a` · AI `#a371f7`(기본 강조) · CODING `#3fb950` |
| 폰트 | Pretendard (jsDelivr CDN, `metadata-hook.html`), 코드 Cascadia Code/Consolas |

- 구 `--neon-cyan/magenta/amber` 는 데이터 전/후 위젯(`data-demo`)용 별칭으로만 유지
- 강조(`--accent`) = AI 보라. 선택 영역·인용 테두리·활성 메뉴·태그 호버·TOC 하이라이트

### 요소
```
┌───────────┬────────────────────────────────────────┐
│▀▀▀▀▀▀▀▀▀▀▀│ 홈 › 글 제목                 [검색]    │  ← 사이드바 상단 3px 팩 색 그라데이션
│  (avatar) │────────────────────────────────────────│
│ HOTEASIK  │ 제목                          │ 목차   │  ← 오른쪽 패널은 목차만
│ tagline   │ 날짜 · 카테고리               │ ▌항목  │
│▌홈        │ 본문 …                        │  항목  │  ← 활성 메뉴 = 보라 왼쪽 막대
│ 블로그    │                                │        │
│ 카테고리  │ [tag] [tag]                    │        │
│ 소개      │                                │        │
│ (gh)(✉)   │                                │        │
└───────────┴────────────────────────────────────────┘
```
- 사이드바: 홈 아이콘 `fa-layer-group`, 메뉴 = 홈 · 블로그 · 카테고리 · 소개
- 사이드바 접기/펴기(데스크톱 ≥850px): 헤더 버튼 또는 `Ctrl+\` → 펼침 → 아이콘 레일(74px) → 숨김 순환,
  숨김 시 왼쪽 손잡이로 다시 펼침, 상태는 `localStorage('hoteasik-sb')`
- 블로그 목록 카드: 둥근 12px, 왼쪽 3px 테두리 = 경로 중 `packs.yml` 색이 있는 가장 깊은 팩 색,
  메타 앞에 팩 경로(`AI › 부품 › 은닉층`)
- 태그: 알약형, 호버 시 강조색 테두리·글자
- h2 아래 얇은 구분선, 코드블록 둥근 10px
