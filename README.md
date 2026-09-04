# HOTEASIK.github.io

**스팀펑크 신경망 조립 공장** 테마 깃 블로그. 순수 HTML/CSS/JS, 빌드 도구 없음
(Jekyll/Hugo/Node 불필요).

- 사이드바 **부품 목록**(입력/합성곱/풀링/완전연결)을 캔버스(작업대)에 자유롭게 드래그 배치
- 화면 하단 **컨베이어 벨트**에 부품을 왼쪽(입력)→오른쪽(출력) 순서로 올리면
  LeNet-5, CNN 같은 알려진 구조를 자동 인식 (화학 게임의 원소 조합 방식 참고)
- 부품/글 목록을 클릭하면 각각 전용 창(캔버스)이 새로 열림
- 글들은 Obsidian처럼 **그래프 뷰 · 백링크**로 서로 연결됨

## 구조

```
index.html                 메인 셸 (사이드바 + 캔버스 + 컨베이어 + 리더 + 부품 상세)
assets/css/style.css       스팀펑크(황동·녹슨철) 테마 스타일
assets/js/app.js           글 로딩 · 캔버스 줌/팬 · 그래프 · 리더 로직
assets/js/factory.js       부품 목록 · 드래그앤드롭 배치 · 컨베이어 조립/인식 로직
assets/parts/parts.json    부품 카탈로그 (이미지로 커스텀 가능, 아래 참고)
assets/parts/recipes.json  인식할 아키텍처 레시피 (LeNet-5, CNN…)
assets/parts/images/*.svg  부품 아이콘 이미지
_post/manifest.json        글 목록 (파일명 배열)
_post/*.md                 글 (frontmatter + 마크다운 본문)
.nojekyll                   GitHub Pages가 _post 폴더를 그대로 서빙하도록 함 (필수, 지우지 말 것)
```

## 부품을 이미지로 커스텀하는 법

1. 아이콘 이미지(svg/png 등)를 `assets/parts/images/`에 추가.
2. `assets/parts/parts.json`에 항목 추가/수정:

   ```json
   {
     "id": "dropout",
     "label": "드롭아웃",
     "category": "fc",
     "icon": "assets/parts/images/dropout.png",
     "desc": "일부 연결을 무작위로 끊어 과적합을 막는 장치."
   }
   ```

   - `id`: 레시피에서 참조할 고유 키
   - `category`: 느슨한 인식(loosePattern)에 쓰이는 분류 (예: `conv`, `pool`, `fc`, `input`)
   - `icon`: 원하는 이미지로 교체만 하면 목록·작업대·컨베이어 아이콘이 모두 바뀜

3. 새 조합을 인식시키고 싶다면 `assets/parts/recipes.json`에 추가:

   ```json
   {
     "id": "my-net",
     "label": "MyNet",
     "sequence": ["input", "conv", "pool", "fc"],
     "postId": "cnn",
     "hint": "설명 문구"
   }
   ```

   `sequence`를 정확히 맞추면 인식(`loose: true`면 `loosePattern`으로 느슨하게 인식).
   `postId`를 지정하면 "자세히 보기" 버튼이 해당 `_post` 글을 엶.

## 새 글 쓰는 법

1. `_post/` 에 마크다운 파일 추가, 예: `_post/2026-09-10-my-post.md`

   ```markdown
   ---
   id: my-post
   title: 글 제목
   date: 2026-09-10
   tags: [태그1, 태그2]
   links: [welcome]        # 연결할 다른 글의 id (선택)
   x: 700                  # 캔버스 위 카드 좌표 (선택, 기본 0)
   y: 200
   ---

   본문은 일반 마크다운. `[[다른글id]]` 로 위키링크도 가능.
   ```

2. `_post/manifest.json` 배열에 파일명 추가.
3. 커밋 후 `main` 브랜치에 푸시하면 GitHub Pages에 반영됨.

## 로컬 미리보기

정적 파일이므로 아무 로컬 서버로 열면 됨 (파일을 브라우저로 바로 열면 fetch가 막힐 수 있음):

```bash
python -m http.server 8000
# http://localhost:8000
```

## 조작법

- 캔버스: 스크롤로 확대/축소, 드래그로 이동
- 카드 / 사이드바 글 목록 / 그래프 노드 클릭 → 카메라가 이동하며 글이 열림
- 검색창: 제목·태그로 카드/목록 필터링 (일치하지 않는 항목은 흐려짐)
- `Esc` 또는 배경 클릭으로 글 닫기, URL에 `#글id`로 직접 공유 가능
