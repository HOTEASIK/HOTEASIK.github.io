---
title: 이동(Translation)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 기하변환, OpenCV, AI응용]
---
# 이동(Translation)

## 정의·핵심
- **정의**: 영상의 모든 픽셀을 **x축으로 tx, y축으로 ty만큼 평행 이동**하는 변환. **위치만 변경**되고 크기·각도는 유지 (응용 2차시)
- **변환 행렬 (2×3)**: `M = [[1, 0, tx], [0, 1, ty]]`
  - tx > 0 → 오른쪽, ty > 0 → **아래쪽** (영상 좌표는 y가 아래로 증가)
- **OpenCV**: `dst = cv2.warpAffine(img, M, (w, h))`
  - `M`은 **float32**
  - `dsize`는 `(너비, 높이)` 순서 — `img.shape`는 `(h, w)`이므로 뒤집어 넣는다
  - 액자(출력 크기)는 그대로라 **밖으로 나간 부분은 잘리고**, 빈 곳은 `borderValue`(기본 0, 검정)로 채움
  - `borderMode=cv2.BORDER_REPLICATE`(가장자리 복제), `BORDER_REFLECT`(반사), `BORDER_WRAP`(반대편에서 다시 나타남) 선택 가능
- **정수 이동은 보간 없이 정확**, 소수 이동(0.5픽셀 등)은 보간으로 값이 섞인다
- **NumPy로 직접**: 슬라이싱 복사 또는 `np.roll`(순환 이동 — 밖으로 나간 부분이 반대편에 나타남)
- **활용**: 데이터 증강(`RandomAffine(translate=...)`), 영상 정렬(흔들림 보정), 객체 위치 맞추기

## 수식·원리
```
x' = x + tx,  y' = y + ty
M = [[1, 0, tx],
     [0, 1, ty]]
```

## 코드 예시
```python
import numpy as np
import cv2

img = np.zeros((5, 6), np.uint8)
img[1, 1] = 255
h, w = img.shape
M = np.float32([[1, 0, 3], [0, 1, 2]])                         # 오른쪽 3, 아래 2
out = cv2.warpAffine(img, M, (w, h))                           # dsize = (w, h)
print(np.argwhere(out == 255).tolist())                        # [[3, 4]]  (y=1+2, x=1+3)
wrap = cv2.warpAffine(img, np.float32([[1, 0, 5], [0, 1, 0]]), (w, h), borderMode=cv2.BORDER_WRAP)
print(np.argwhere(wrap == 255).tolist())                       # [[1, 0]]  (1+5=6 → 0으로 순환)
print(np.argwhere(np.roll(img, 5, axis=1) == 255).tolist())    # [[1, 0]]  np.roll도 순환
half = cv2.warpAffine(img, np.float32([[1, 0, 0.5], [0, 1, 0]]), (w, h))
print(half[1, 1:3].tolist())                                   # [128, 128]  소수 이동은 보간으로 나뉨
```

## 관련 개념
[[기하학적 변환 개념]] · [[아핀 변환]] · [[회전]] · [[보간법]] · [[데이터 증강]]
