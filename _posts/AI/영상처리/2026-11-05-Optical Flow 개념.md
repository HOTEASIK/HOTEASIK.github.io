---
title: Optical Flow 개념
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 옵티컬플로우, 추적, OpenCV, AI응용]
---
# Optical Flow 개념

## 정의·핵심
- **정의**: Optical Flow(광류). 연속한 두 프레임 사이에서 **각 픽셀(또는 특징점)이 어느 방향으로 얼마나 움직였는지**를 나타내는 **2D 움직임 벡터 (u, v)** 의 분포 (응용 4차시)
- **기본 가정 (강의)**
  1. **밝기 항상성 (Brightness Constancy)**: 움직여도 픽셀의 밝기는 변하지 않는다 → `I(x, y, t) = I(x + dx, y + dy, t + dt)`
  2. **작은 움직임**: 프레임 간 이동이 작다 → **테일러 1차 근사** 가능
  3. **공간 일관성**: 이웃 픽셀은 비슷하게 움직인다 (Lucas-Kanade의 가정)
- **광류 제약 방정식**: 위 가정으로부터 `Ix·u + Iy·v + It = 0` — **식 1개에 미지수 2개(u, v)** → 혼자서는 풀 수 없음(**조리개 문제, Aperture Problem**) → 추가 가정이 필요
- **두 종류 (강의)**

| | Sparse | Dense |
|---|---|---|
| 대상 | **선택한 특징점만** (코너) | **모든 픽셀** |
| 대표 | **Lucas-Kanade** | **Farneback**, RAFT(딥러닝) |
| 속도 | 빠름 | 계산량 큼 |
| 결과 | 점의 궤적 | 픽셀별 (u, v) 맵 → HSV 시각화 |
| 문서 | [[Lucas-Kanade(Sparse Optical Flow)]] | [[Dense Optical Flow]], [[RAFT]] |

- **가정이 깨지는 경우**: 조명 변화(밝기 항상성 ✗), **빠른 움직임**(작은 움직임 ✗ → 이미지 피라미드로 보완), 가림·경계(공간 일관성 ✗), 텍스처 없는 영역(그래디언트 0)
- **활용**: 객체 추적, **영상 안정화**(흔들림 보정), **행동 인식**(Two-Stream 네트워크의 motion 입력), 자율주행(자차·주변 움직임), 프레임 보간(슬로모션), 동영상 압축(움직임 보상)
- 추적 계열 비교: [[MeanShift 추적]]·[[CamShift 추적]]은 **색 분포**로 영역을 추적 ↔ Optical Flow는 **밝기 패턴의 이동** 자체를 추정

## 수식·원리
```
I(x, y, t) = I(x + dx, y + dy, t + dt)              (밝기 항상성)
≈ I(x, y, t) + Ix·dx + Iy·dy + It·dt                (테일러 1차)
⇒ Ix·u + Iy·v + It = 0     (u = dx/dt, v = dy/dt)    (광류 제약식)
```

## 코드 예시
```python
import numpy as np
import cv2

x = np.arange(64, dtype=np.float32)
X, Y = np.meshgrid(x, x)
I0 = 128 + 60 * np.sin(X / 6) * np.cos(Y / 7)                  # 부드러운 텍스처
I1 = 128 + 60 * np.sin((X - 1) / 6) * np.cos((Y - 0.5) / 7)    # 오른쪽 1, 아래 0.5 이동
Ix = cv2.Sobel(I0, cv2.CV_32F, 1, 0, ksize=3) / 8
Iy = cv2.Sobel(I0, cv2.CV_32F, 0, 1, ksize=3) / 8
It = I1 - I0
u, v = 1.0, 0.5
res = (Ix * u + Iy * v + It)[5:-5, 5:-5]
print(round(float(np.abs(res).mean()), 2), round(float(np.abs(It).mean()), 2))   # 0.53 4.77  제약식 잔차 ≪ 밝기 변화

A = np.array([[Ix[30, 30], Iy[30, 30]]])                       # 한 픽셀만으로는 식 1개
print(np.linalg.matrix_rank(A))                                # 1  미지수 2개 → 조리개 문제
```

## 관련 개념
[[Lucas-Kanade(Sparse Optical Flow)]] · [[Dense Optical Flow]] · [[RAFT]] · [[Sobel 필터]] · [[동영상 처리]]
