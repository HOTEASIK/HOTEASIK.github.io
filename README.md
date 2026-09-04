# HOTEASIK.github.io

**스팀펑크 신경망 조립 공장** 테마 깃 블로그. 순수 HTML/CSS/JS, 빌드 도구 없음
(Jekyll/Hugo/Node 불필요).

- 부품 창고가 **폴더 트리**(`_parts/…`)로 되어 있음 — 폴더 안에 폴더를 얼마든지 중첩 가능
  (예: 은닉층 폴더 → 풀링 폴더 → 평균풀링 부품)
- 사이드바 **부품 창고**를 펼치고/접으며 탐색, 캔버스(작업대)에 자유롭게 드래그 배치
- **폴더**와 **글(노트)**도 작업대에 드래그해서 놓을 수 있음 (노트는 클릭하면 바로 그 글이 열림)
- 부품 폴더 트리 전체가 **그래프 뷰**에 방사형으로 함께 배치됨 — 폴더 구조 선, 그리고 어느
  부품이 어느 아키텍처(글)에 쓰이는지 점선으로 연결
- 화면 하단 **컨베이어 벨트**에 부품을 왼쪽(입력)→오른쪽(출력) 순서로 올린 뒤 **⚙ 제작** 버튼을
  눌러야 인식 결과가 나옴 (화학 게임처럼 조합 → 제작 → 결과 확인)
- 조립 결과(출력) 이름 자체가 링크 — **클릭하면 그 이름의 노트(글)로 바로 이동**
- 부품/글을 클릭하면 각각 전용 창(캔버스)이 새로 열림
- 글들도 Obsidian처럼 **그래프 뷰 · 백링크**로 서로 연결됨

## 구조

```
index.html                       메인 셸 (사이드바 + 캔버스 + 컨베이어 + 리더 + 부품 상세)
assets/css/style.css             스팀펑크(황동·녹슨철) 테마 스타일
assets/js/app.js                 글 로딩 · 캔버스 줌/팬 · 그래프 · 리더 로직
assets/js/factory.js             부품 트리 로딩 · 드래그앤드롭 배치 · 컨베이어 조립/인식 · 그래프 합치기
_parts/manifest.json             부품 창고 트리 (폴더 안에 폴더, 아래 참고)
_parts/recipes.json              인식할 아키텍처 레시피 (LeNet-5, CNN…) · 그래프 연결선의 근거
_parts/<카테고리>/.../<id>/part.md  부품 하나 = 폴더 하나 (frontmatter + 설명), 원하는 깊이로 중첩
_parts/<카테고리>/.../<id>/icon.svg 그 부품의 아이콘 (이미지로 커스텀 가능, 아래 참고)
_post/manifest.json              글 목록 (파일명 배열)
_post/*.md                       글 (frontmatter + 마크다운 본문)
.nojekyll                          GitHub Pages가 _post·_parts 폴더를 그대로 서빙하도록 함 (필수, 지우지 말 것)
```

## 부품 트리 구조 (`_parts/manifest.json`)

폴더 안에 폴더를 얼마든지 중첩할 수 있는 트리입니다. 노드는 두 종류뿐입니다.

```json
{
  "type": "folder",
  "label": "부품",
  "children": [
    { "type": "folder", "label": "입력", "children": [
      { "type": "part", "path": "input/input" }
    ]},
    { "type": "folder", "label": "은닉층", "children": [
      { "type": "part", "path": "hidden/conv" },
      { "type": "folder", "label": "풀링", "children": [
        { "type": "part", "path": "hidden/pooling/avgpool" }
      ]},
      { "type": "part", "path": "hidden/fc" }
    ]},
    { "type": "folder", "label": "출력", "children": [
      { "type": "part", "path": "output/pool" }
    ]}
  ]
}
```

- `{ "type": "folder", "label": "...", "children": [...] }` — 폴더. `children`에 폴더를 또 넣으면 중첩됨.
- `{ "type": "part", "path": "..." }` — 부품 하나. `path`는 `_parts/` 기준 상대 경로이고,
  그 경로 폴더 안에 `part.md`와 아이콘 이미지가 있어야 함.

## 부품 추가/커스텀하는 법

1. `_parts/` 아래 원하는 위치에 새 폴더 생성, 예: `_parts/hidden/dropout/`
2. 그 폴더에 아이콘 이미지 추가: `_parts/hidden/dropout/icon.png` (svg/png 등 원하는 형식)
3. `_parts/hidden/dropout/part.md` 작성:

   ```markdown
   ---
   id: dropout
   label: 드롭아웃
   category: fc
   icon: icon.png
   ---

   일부 연결을 무작위로 끊어 과적합을 막는 장치.
   ```

   - `id`: 레시피(`sequence`)에서 참조할 고유 키
   - `category`: 느슨한 인식(`loosePattern`)에 쓰이는 분류 (예: `conv`, `pool`, `fc`, `input`)
   - `icon`: 폴더 안 이미지 파일명 — 교체만 하면 목록·작업대·컨베이어·그래프 아이콘이 모두 바뀜
   - 본문(`---` 아래)은 부품 클릭 시 뜨는 설명

4. `_parts/manifest.json` 트리에 `{ "type": "part", "path": "hidden/dropout" }` 를 원하는
   폴더의 `children` 배열에 추가 (새 폴더로 묶고 싶다면 `folder` 노드로 감싸도 됨).
5. 새 조합을 인식시키고 싶다면 `_parts/recipes.json`에 추가:

   ```json
   {
     "id": "my-net",
     "label": "MyNet",
     "sequence": ["input", "conv", "pool", "fc"],
     "postId": "cnn",
     "hint": "설명 문구"
   }
   ```

   `sequence`를 정확히 맞추면 인식(`loose: true`면 `loosePattern`으로 느슨하게 인식), 컨베이어 옆
   **⚙ 제작** 버튼을 눌러야 결과가 나타납니다. `postId`를 지정하면 완성 시 뜨는 이름(예: "MyNet")이
   그 `_post` 글로 가는 링크가 되고, 그래프 뷰에서도 이 레시피에 쓰인 부품들이 해당 글 노드로
   자동 연결됨.

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
