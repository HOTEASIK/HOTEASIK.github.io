# HOTEASIK.github.io

**Robot Developer · 로보틱스 · AI · 코딩 포트폴리오.**
[cotes2020/jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) (`~> 7.6`) 기반 + 카드팩 스킨.

- **홈** = 카드팩 포트폴리오. `_posts` 의 폴더 구조가 그대로 팩이 된다.
  - 상위 팩(ROBOTICS · AI · CODING) → 하위 팩 → 카드(글) 순으로 연다. 폴더 깊이 제한 없음.
  - 팩을 열면 하위 팩이 튀어나와 하단에 놓이고, 상단에 **대시보드**
    (글 수 · 하위 분야 수 · 태그 수 · 최근 활동 / 분야별 글 막대그래프 / 태그 Top 8 / 최근 글 2개).
  - 카드만 든 팩을 열면 카드가 손에 쥔 듯 부채꼴로 펼쳐지고, 카드를 고르면 뒤집히며 상세
    (날짜 · 태그 · 요약 · 대표 이미지 · `글 읽기 →`).
  - `← 뒤로` / 경로(`HOME › AI › 부품`) / `ESC` 로 한 단계씩 복귀.
  - 팩이 한 줄을 넘으면 **가로 캐러셀**: 마우스 드래그·터치 스와이프·`‹ ›` 로 넘기고, 가운데 팩 강조.
  - 현재 위치가 주소에 남는다(`/#AI/부품/은닉층`). 글을 읽고 뒤로가기 하면 보던 팩으로 복귀, 링크로 공유 가능.
  - 키보드(Tab · Enter/Space · ESC)로 조작 가능, OS '동작 줄이기' 설정 시 애니메이션 최소화.
  - 데이터 오류·글 0개·JS 꺼짐 시 블로그 링크 안내, 이미지 로드 실패 시 emoji/팩 아이콘으로 대체.
- **스킨**: 카드팩과 같은 다크 톤(`#0d1117` / `#161b22`, 테두리 `#30363d`) + 팩 색 포인트
  (ROBOTICS `#ff7b3a` · AI `#a371f7` · CODING `#3fb950`), 폰트 Pretendard.
- **사이드바**: 홈 · 블로그 · 카테고리 · 소개. 상단 버튼(또는 `Ctrl+\`)으로
  펼침 → 아이콘 레일 → 완전 숨김 순환, 숨김 상태에서는 왼쪽 손잡이로 다시 열기 (상태 저장, 데스크톱 ≥850px).
- **블로그 목록**: 글마다 팩 경로(`AI › 부품 › 은닉층`)와 팩 색 왼쪽 테두리.
- 글 오른쪽 패널은 **목차만** (Chirpy 의 최근 업데이트·인기 태그는 빈 include 로 숨김).
- 부품·개념·모델·프로젝트는 **모두 각각 하나의 글**. 위치는 `_posts/<상위팩>/<하위팩>/…/*.md`,
  `frontmatter` 의 `layer` / `kind` 로 성격을 표시한다.

## 구조

```
_config.yml                     사이트 설정 (lang: ko-KR, theme_mode: dark)
Gemfile                         jekyll-theme-chirpy 의존성
.github/workflows/pages-deploy.yml   빌드·배포 (GitHub Actions)

index.html                     홈 (layout: home)
_layouts/home.html             ★ 카드팩 홈 — 글 목록·폴더 경로를 JSON 으로 심어 cardpack.js 에 전달 (Chirpy home 오버라이드)
_tabs/{blog,categories,about}.md   전체 글 목록 / 카테고리 / 소개

_includes/metadata-hook.html   ★ 헤드 확장점 — Pretendard 폰트 + 사이드바 JS + 데이터 전/후 위젯 로드
_includes/sidebar.html         ★ Chirpy 사이드바 + 3단 토글/재열기 버튼
_includes/update-list.html     ★ 빈 파일 — '최근 업데이트' 숨김
_includes/trending-tags.html   ★ 빈 파일 — '인기 태그' 숨김
_includes/data-demo.html       데이터 전처리 글 전용: 처리 전/후 시각 비교 위젯
assets/css/jekyll-theme-chirpy.scss  ★ 카드팩 스킨 (Chirpy 다크 CSS 변수 오버라이드 + 3단 사이드바)
assets/css/cardpack.css        카드팩 홈 스타일 (클래스는 모두 cp- 접두어, Bootstrap 충돌 방지)
assets/js/sidebar-collapse.js  3단 사이드바 동작
assets/js/cardpack.js          카드팩 홈 동작 (팩 트리 구성·대시보드·부채꼴·카드 상세, vanilla)
assets/css/data-demo.css       데이터 전/후 위젯 스타일
assets/js/data-demo.js         데이터 전/후 위젯 토글 (vanilla)

assets/img/logo.png            호박벌 로고 (avatar)
assets/img/favicons/*          파비콘 세트

_posts/<팩>/<하위팩>/YYYY-MM-DD-<slug>.md   모든 글 (폴더 = 카드팩)
  AI/부품/{입력층,전처리층,은닉층,출력층,학습방법,평가방법}
  AI/모델 · AI/개념 · AI/메타
_data/packs.yml                카드팩 아이콘·색·순서 (키 = 폴더 이름)
_data/contact.yml              사이드바 하단 아이콘

_plugins/wikilink.rb           본문 [[slug]] → 그 글 링크 (CI 빌드에서 동작)
_plugins/posts-lastmod-hook.rb Chirpy 표준
assets/parts/*.svg             부품 아이콘
```

> ★ = Chirpy gem 파일을 같은 경로로 덮어쓰는 오버라이드. gem 을 `~> 7.6` 으로 고정할 것.

## 글(노트) 쓰는 법

`_posts/AI/부품/은닉층/2026-09-10-<slug>.md`:

```markdown
---
title: 레이어 정규화
date: 2026-09-10 10:00:00 +0900
categories: [부품, 은닉층]
tags: [norm]
emoji: 🧩               # 선택: 카드 아이콘 (icon 이 있으면 icon 우선, 둘 다 없으면 팩 아이콘)
image: /assets/img/…   # 선택: 카드 상세의 대표 이미지
layer: hidden          # input | hidden | output | training | eval | concept | model | preprocess
kind: norm             # 세부: activation, conv, recurrent, pooling, dense, loss, norm,
                       #   attention, optimizer, regularization,
                       #   classification, regression, detection, generation, ranking …
icon: /assets/parts/norm.svg   # 선택: 카드 아이콘 SVG
---

본문. `[[relu]]` 또는 `[[relu|렐루]]` 로 다른 글에 링크.
```

- `slug` = 파일명에서 날짜를 뗀 부분. `[[slug]]` 가 이 값으로 서로를 참조한다.
- `layer: preprocess` 글(데이터 전처리)은 본문에 `{% include data-demo.html type="missing-value" %}`
  처럼 넣으면 처리 전/후를 비교하는 위젯이 뜬다. `type` 은 `missing-value` / `feature-scaling` /
  `augmentation` / `split` 중 하나 (새 종류 추가 시 `_includes/data-demo.html` 의 `case` 문에 보태면 됨).
- 모델(LeNet-5, VLA 등)은 `layer: model`, `categories: [모델]`.
- 폴더는 카드팩 위치만 정한다. URL(`/posts/<slug>/`)·카테고리·`[[slug]]` 는 폴더와 무관하므로
  글을 다른 폴더로 옮겨도 링크가 깨지지 않는다. `_posts` 바로 아래 글은 카드팩에 나오지 않는다.
- 카드 요약은 `description` 이 있으면 그것, 없으면 본문 첫 문단(160자).

## 카드팩 (`_data/packs.yml`)

```yaml
ROBOTICS:    { icon: "🤖", color: "#ff7b3a", order: 1, top: true }
MANIPULATOR: { icon: "🦾", color: "#ff9d5c", order: 1 }
```

- 키 = `_posts` 안의 폴더 이름. 새 폴더에 글을 넣으면 팩이 자동으로 생긴다.
- `packs.yml` 에 없는 폴더는 아이콘 📦, 색은 상위 팩을 따른다. `order` 가 작을수록 앞.
- `top: true` = 글이 없어도 홈에 `COMING SOON` 으로 표시(클릭 불가).
- 한 팩에 하위 폴더와 글이 같이 있으면, 직속 글은 `기타` 팩으로 묶인다.
  이름·아이콘은 `_etc: { name: "기타", icon: "🗂️" }` 로 변경. 같은 이름 폴더가 있으면 `기타 (직속)`.
- 폴더 깊이 제한 없음 (`_posts/ROBOTICS/MOBILE/SLAM/2D/…` → 4단계 팩).
- 블로그 목록 카드의 테두리 색 = 경로 중 `packs.yml` 에 색이 있는 가장 깊은 팩의 색.

## 배포

로컬에 Ruby 없이도 **GitHub Actions 가 빌드·배포**한다.

1. GitHub 레포 **Settings → Pages → Source: `GitHub Actions`**
2. `main` 에 push → Actions "Build and Deploy" 통과 시 <https://hoteasik.github.io> 반영
3. (댓글) Settings → Discussions 활성화 → <https://github.com/apps/giscus> 설치 →
   <https://giscus.app> 에서 얻은 `repo_id` · `category_id` 를 `_config.yml` 의
   `comments.giscus` 에 넣고 `comments.provider: giscus` 주석 해제

> `pages-deploy.yml` 의 htmlproofer 단계는 첫 배포 안정화용으로 `continue-on-error: true`.
> 링크 경고가 정리되면 제거할 것.

> 배포 후에도 옛 화면이 보이면 PWA 캐시 때문이다. `Ctrl+Shift+R` 또는 개발자도구 →
> Application → Clear site data.

## 로컬 미리보기 (선택, Ruby 필요)

```bash
# RubyInstaller + DevKit (Windows) 설치 후
gem install bundler
bundle
bundle exec jekyll s        # http://127.0.0.1:4000
```
