# HOTEASIK.github.io

**개념을 조립하고 합성하는 학습 공장.**
[cotes2020/jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) (`~> 7.6`) 기반.

- 사이드바: **홈 · 조합 & 합성 · 블로그 · 소개**
- 부품·개념·모델은 **모두 각각 하나의 글**(`_posts/*.md`)이다. `frontmatter` 의
  `layer` / `kind` 로 성격을 표시한다.
- **/lab/** 에서 그 글들을 재료로 드래그앤드롭해 새 모델·개념을 만든다.
  - **조합**: 층을 순서대로 벨트에 올려 모델 인식 (예: 입력→합성곱→풀링→완전연결→출력 = CNN)
  - **합성**: 개념을 상자에 담아 상위 개념 (예: 물리+화학 = 물리화학, LLM+CNN+로보틱스 = VLA)

## 구조

```
_config.yml                     사이트 설정 (lang: ko-KR, giscus 등)
Gemfile                         jekyll-theme-chirpy 의존성
.github/workflows/pages-deploy.yml   빌드·배포 (GitHub Actions)

_tabs/lab.md                    조합 & 합성  (layout: lab)
_tabs/blog.md                   전체 글 목록
_tabs/about.md                  소개
index.html                     홈 (layout: landing)

_layouts/landing.html           홈 레이아웃
_layouts/lab.html               랩 레이아웃 — 노트/레시피를 JSON 으로 심어 lab.js 에 전달
_layouts/{...}                  나머지는 Chirpy gem 이 제공

_posts/YYYY-MM-DD-<slug>.md      모든 부품·개념·모델
_data/recipes.yml               조합 레시피
_data/syntheses.yml             합성 레시피
_data/contact.yml               사이드바 하단 아이콘

_plugins/wikilink.rb            본문 [[slug]] → 그 글 링크 (CI 빌드에서 동작)
_plugins/posts-lastmod-hook.rb  Chirpy 표준

assets/js/lab.js                조합·합성 엔진 (vanilla, 의존성 없음)
assets/css/lab.css              랩 스타일
assets/parts/*.svg              부품 아이콘
```

## 글(노트) 쓰는 법

`_posts/2026-09-10-<slug>.md`:

```markdown
---
title: 레이어 정규화
date: 2026-09-10 10:00:00 +0900
categories: [부품, 은닉층]
tags: [norm]
layer: hidden          # input | hidden | output | training | eval | concept | model
kind: norm             # 세부: activation, conv, recurrent, pooling, dense, loss, norm,
                       #   attention, optimizer, regularization,
                       #   classification, regression, detection, generation, ranking …
icon: /assets/parts/norm.svg   # 선택 (없으면 layer 색 점)
combinable: true       # 조합 벨트의 부품으로 노출
synthesizable: true    # 합성 상자의 재료로 노출
weight: 1              # 대시보드 비중 (은닉층 핵심은 2)
---

본문. `[[relu]]` 또는 `[[relu|렐루]]` 로 다른 글에 링크.
```

- `slug` = 파일명에서 날짜를 뗀 부분. `[[slug]]` 와 레시피가 이 값으로 서로를 참조한다.
- 모델(LeNet-5, VLA 등)은 `layer: model`, `categories: [모델]`, 보통 `combinable`/`synthesizable` 없음.

## 조합 레시피 (`_data/recipes.yml`)

```yaml
- id: my-net
  label: MyNet
  sequence: [input, conv, pool, fc, softmax-out]   # 정확한 순서, slug 배열
  # 또는
  loose: [input, conv, pooling, fc]                # slug 또는 kind. 이 순서로 한 번씩이면 인식
  post: my-net                                     # 완성 시 이동할 글 slug
  hint: 한 줄 설명
```

## 합성 레시피 (`_data/syntheses.yml`)

```yaml
- id: my-fusion
  label: 융합개념
  inputs: [physics, chemistry]   # 순서 무관 집합
  loose: false                   # true 면 이 재료들을 "포함"만 해도 인식
  post: my-fusion
```

## 배포

로컬에 Ruby 없이도 **GitHub Actions 가 빌드·배포**한다.

1. GitHub 레포 **Settings → Pages → Source: `GitHub Actions`**
2. `main` 에 push → Actions "Build and Deploy" 통과 시 <https://hoteasik.github.io> 반영
3. (댓글) Settings → Discussions 활성화 → <https://github.com/apps/giscus> 설치 →
   <https://giscus.app> 에서 얻은 `repo_id` · `category_id` 를 `_config.yml` 의
   `comments.giscus` 에 넣고 `comments.provider: giscus` 주석 해제

> `pages-deploy.yml` 의 htmlproofer 단계는 첫 배포 안정화용으로 `continue-on-error: true`.
> 링크 경고가 정리되면 제거할 것.

## 로컬 미리보기 (선택, Ruby 필요)

```bash
# RubyInstaller + DevKit (Windows) 설치 후
gem install bundler
bundle
bundle exec jekyll s        # http://127.0.0.1:4000
```
