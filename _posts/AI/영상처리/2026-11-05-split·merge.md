---
title: split·merge
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, OpenCV, AI응용]
---
# split·merge

## 정의·핵심
- **`cv2.split(img)`**: 다채널 영상을 **채널별 단일 채널 영상들로 분리** → `b, g, r = cv2.split(img)` (각각 `(H, W)`)
- **`cv2.merge([c0, c1, c2])`**: 단일 채널들을 **하나의 다채널 영상으로 합침** → `(H, W, 3)` (응용 1차시)
- **용도**
  - 특정 채널만 보기·처리: R 채널만 강조, V 채널만 평활화(HSV에서 V만 `equalizeHist` 후 merge → 색은 유지하고 밝기 대비만 개선) → [[히스토그램 평활화(Equalization)]]
  - 채널 순서 바꾸기: `cv2.merge([r, g, b])` = BGR → RGB
  - 채널 하나를 0으로: `cv2.merge([b, zeros, zeros])` → 파랑만 남은 영상
  - 알파 채널 붙이기: `cv2.merge([b, g, r, alpha])` → 4채널 PNG
- **채널 하나를 그냥 imshow하면 흑백**으로 보인다 (값 = 그 색의 밝기). Red 채널이 밝은 곳 = 빨강 성분이 많은 곳
- **NumPy 대안 (더 빠름)**
  - split: `b, g, r = img[..., 0], img[..., 1], img[..., 2]` (뷰라 복사 없음)
  - merge: `np.dstack([b, g, r])` 또는 `np.stack([...], axis=-1)`
  - `cv2.split`은 복사본을 만들어 큰 영상에서는 느리다
- `cv2.split`은 채널 리스트/튜플을 반환, `merge`에 넣는 채널들은 **크기·dtype이 같아야** 한다

## 수식·원리
```
split: (H, W, C) → C × (H, W)
merge: C × (H, W) → (H, W, C)
```

## 코드 예시
```python
import numpy as np
import cv2

img = np.zeros((2, 2, 3), np.uint8)
img[:] = (10, 20, 30)                                   # B=10, G=20, R=30
b, g, r = cv2.split(img)
print(b.shape, b[0, 0], g[0, 0], r[0, 0])               # (2, 2) 10 20 30
rgb = cv2.merge([r, g, b])
print(rgb[0, 0].tolist(), np.array_equal(rgb, cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))   # [30, 20, 10] True
zeros = np.zeros_like(b)
only_red = cv2.merge([zeros, zeros, r])
print(only_red[0, 0].tolist())                          # [0, 0, 30]
print(np.array_equal(np.dstack([b, g, r]), img))        # True  NumPy로 같은 merge
bgra = cv2.merge([b, g, r, np.full_like(b, 255)])
print(bgra.shape)                                       # (2, 2, 4)
```

## 관련 개념
[[영상 = 행렬]] · [[RGB·BGR]] · [[cvtColor]] · [[히스토그램 평활화(Equalization)]]
