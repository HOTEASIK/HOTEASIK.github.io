---
title: Dense Optical Flow
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 옵티컬플로우, OpenCV, AI응용]
---
# Dense Optical Flow

## 정의·핵심
- **정의**: 특징점 몇 개가 아니라 **영상의 모든 픽셀에 대해 움직임 벡터 (u, v)** 를 계산하는 광류. 결과는 `(H, W, 2)` 크기의 **flow 맵** (응용 4차시)
- **대표: Farneback 알고리즘**
  - 각 픽셀 주변을 **2차 다항식으로 근사**하고, 두 프레임 다항식 계수의 변화로 이동량을 추정 (피라미드로 큰 움직임 처리)
  - `flow = cv2.calcOpticalFlowFarneback(prev, next, None, pyr_scale=0.5, levels=3, winsize=15, iterations=3, poly_n=5, poly_sigma=1.2, flags=0)`
  - 입력은 **흑백**, `flow[y, x] = (u, v)` (float32)
- **HSV 시각화 (강의)**
  - `mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])`
  - **Hue = 방향**(ang × 180/π/2 → 0~180), **Value = 속도**(`normalize(mag, 0~255)`), Saturation = 255
  - → `cvtColor(hsv, HSV2BGR)`: 같은 방향으로 움직이는 영역은 **같은 색**, 빠를수록 **밝게**, 정지 영역은 검정
- **Sparse(LK)와 비교 (강의)**: 모든 픽셀 → **정보가 풍부**하지만 **계산 비용이 높음** (실시간은 해상도 축소 필요) → [[Lucas-Kanade(Sparse Optical Flow)]]
- **활용 (강의)**: **행동 인식**(움직임 패턴), **자율주행**(주변 물체의 움직임), 움직이는 물체 분할(`mag > 임계값`), 프레임 보간, 와핑(`remap`으로 프레임 정렬) → [[remap]]
- 다른 고전 방법: `cv2.DISOpticalFlow_create()`(빠름), TV-L1(contrib) / 딥러닝: **[[RAFT]]**, FlowNet, PWC-Net — 가림·큰 움직임에 훨씬 강함

## 수식·원리
```
flow(x, y) = (u, v):  I_t(x, y) ≈ I_{t+1}(x + u, y + v)
mag = sqrt(u² + v²),  ang = atan2(v, u)
HSV:  H = ang·(180/π)/2,  S = 255,  V = normalize(mag)
```

## 코드 예시
```python
import numpy as np
import cv2

rng = np.random.default_rng(0)
bg = cv2.GaussianBlur(rng.integers(0, 256, (100, 140), dtype=np.uint8), (7, 7), 0)
prev, nxt = bg.copy(), bg.copy()
patch = cv2.GaussianBlur(rng.integers(0, 256, (30, 30), dtype=np.uint8), (5, 5), 0)
prev[35:65, 40:70] = patch
nxt[35:65, 45:75] = patch                                   # 물체만 오른쪽으로 5픽셀

flow = cv2.calcOpticalFlowFarneback(prev, nxt, None, 0.5, 3, 15, 3, 5, 1.2, 0)
print(flow.shape, flow.dtype)                               # (100, 140, 2) float32
print(np.round(flow[50, 57], 1).tolist())                   # [5.0, 0.0]  물체 내부
print(np.round(flow[10, 10], 1).tolist())                   # [-0.0, -0.0]  배경은 정지

mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
hsv = np.zeros((*prev.shape, 3), np.uint8)
hsv[..., 0] = ang * 180 / np.pi / 2                         # Hue = 방향
hsv[..., 1] = 255
hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)   # Value = 속도
bgr = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
moving = mag > 2
print(bgr.shape, moving[50, 57], moving[10, 10])            # (100, 140, 3) True False  움직이는 영역 분할
```

## 관련 개념
[[Optical Flow 개념]] · [[Lucas-Kanade(Sparse Optical Flow)]] · [[RAFT]] · [[HSV]] · [[remap]]
