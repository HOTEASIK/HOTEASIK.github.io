---
title: Laplacian 필터
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 엣지, OpenCV, AI응용]
---
# Laplacian 필터

## 정의·핵심
- **정의**: **2차 미분** 기반 엣지 검출 필터. **방향 구분 없이** 전체적인 엣지를 강조 (응용 2차시 필터 표)
- **원리**
  - 1차 미분(Sobel)은 엣지에서 **극대**, 2차 미분(Laplacian)은 엣지에서 **부호가 바뀐다(zero-crossing)**
  - x방향 2차 미분 + y방향 2차 미분을 한 번에 → **방향과 무관**(등방성)
  - 커널 (4-이웃): `[[0,1,0],[1,-4,1],[0,1,0]]`, (8-이웃): `[[1,1,1],[1,-8,1],[1,1,1]]`
- **함수**: `cv2.Laplacian(src, ddepth, ksize=1)`
  - **ddepth는 `cv2.CV_64F`** 로 (양·음 값 모두 생김), 표시할 때 `convertScaleAbs`
  - ksize=1이면 위의 3×3 4-이웃 커널
- **특징**
  - 장점: 한 번의 연산으로 모든 방향의 엣지, 가는 선·점에 민감
  - 단점: 2차 미분이라 **잡음에 더 민감** → 먼저 **가우시안 블러** (= **LoG, Laplacian of Gaussian**)
  - 엣지 방향 정보는 주지 않는다 (Sobel은 Gx, Gy로 방향을 줌)
- **활용**
  - **샤프닝**: `원본 − Laplacian` (중심 가중치 음수 커널 기준) → 경계가 또렷해짐 (샤프닝 커널 `[[0,-1,0],[-1,5,-1],[0,-1,0]]`이 바로 이것)
  - **초점(블러) 판정**: Laplacian의 **분산**이 작으면 흐린 사진 → 자동 초점·흐린 사진 걸러내기
  - 블롭 검출 (LoG/DoG, SIFT의 기반)

## 수식·원리
```
∇²I = ∂²I/∂x² + ∂²I/∂y²
     ≈ I(x+1,y) + I(x−1,y) + I(x,y+1) + I(x,y−1) − 4·I(x,y)
샤프닝: dst = I − ∇²I
```

## 코드 예시
```python
import numpy as np
import cv2

row = np.array([[10, 10, 10, 100, 100, 100]] * 3, np.uint8)
lap = cv2.Laplacian(row, cv2.CV_64F)
print(lap[1].astype(int).tolist())                     # [0, 0, 90, -90, 0, 0]  경계에서 부호가 바뀜

rng = np.random.default_rng(0)
sharp_img = np.zeros((64, 64), np.uint8); sharp_img[16:48, 16:48] = 255
sharp_img = cv2.add(sharp_img, rng.integers(0, 30, sharp_img.shape, dtype=np.uint8))
blurry = cv2.GaussianBlur(sharp_img, (9, 9), 3)
focus = lambda x: round(cv2.Laplacian(x, cv2.CV_64F).var(), 1)
print(focus(sharp_img) > focus(blurry))                # True  흐린 사진은 Laplacian 분산이 작음
k = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], np.float32)
print(np.allclose(cv2.filter2D(row, cv2.CV_64F, k), lap))   # True  커널과 같음
```

## 관련 개념
[[Sobel 필터]] · [[차분(Differencing)]] · [[가우시안 블러]] · [[Canny 엣지 검출]] · [[필터링·커널 개념]]
