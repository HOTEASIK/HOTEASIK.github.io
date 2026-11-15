---
title: Lucas-Kanade(Sparse Optical Flow)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 옵티컬플로우, 추적, OpenCV, AI응용]
---
# Lucas-Kanade(Sparse Optical Flow)

## 정의·핵심
- **정의**: Lucas-Kanade(LK). **선택한 특징점 주변의 작은 창(예: 15×15) 안 픽셀들이 모두 같이 움직인다**고 가정하고, 그 창의 광류 제약식들을 **최소제곱**으로 풀어 점마다 (u, v)를 구하는 **희소(Sparse) 광류** (응용 4차시)
- **3가지 가정 (강의)**
  1. **밝기 항상성**: `I(x, y, t) = I(x + dx, y + dy, t + dt)`
  2. **작은 움직임** → 테일러 근사로 `Ix·u + Iy·v + It = 0`
  3. **지역 일관성**: 주변 영역(창)은 같이 움직인다 → 식이 창 크기만큼 생겨 **조리개 문제 해결** → [[Optical Flow 개념]]
- **피라미드 LK**: 큰 움직임은 가정 2를 깨므로, 영상을 여러 단계로 축소(피라미드)해 **거친 해상도에서 큰 이동 → 세밀한 해상도에서 보정** (`maxLevel`)
- **OpenCV 흐름**
  1. 첫 프레임에서 추적할 점: `p0 = cv2.goodFeaturesToTrack(gray, maxCorners, qualityLevel, minDistance)` → [[Shi-Tomasi]]
  2. `p1, st, err = cv2.calcOpticalFlowPyrLK(prev_gray, gray, p0, None, winSize=(15, 15), maxLevel=2, criteria=...)`
  3. `st == 1`인 점만 유지 (추적 성공) → 궤적 그리기(`cv2.line`) → `p0 = good_new`로 다음 프레임
  4. 점이 줄어들면 주기적으로 다시 검출
- **특징**: **빠름**(점 수백 개), 코너에서 정확 / **큰 움직임에 약함**(피라미드로 완화), 텍스처 없는 곳·가림에 취약
- **왜 코너인가**: 창 안 행렬 `AᵀA`가 **두 고유값 모두 커야**(가역) 해가 안정 → 이게 바로 Shi-Tomasi의 코너 조건
- **활용 (강의)**: **영상 안정화**(점 이동으로 카메라 흔들림 추정 → 역보정), 특징점 추적, Visual Odometry, 얼굴 랜드마크 추적

## 수식·원리
```
창 안 n개 픽셀:  A·[u, v]ᵀ = b,   A = [[Ix1, Iy1], ..., [Ixn, Iyn]],  b = −[It1, ..., Itn]
최소제곱:  [u, v]ᵀ = (AᵀA)⁻¹ Aᵀ b
AᵀA = [[ΣIx², ΣIxIy], [ΣIxIy, ΣIy²]]  → 두 고유값이 클 때(코너) 안정
```

## 코드 예시
```python
import numpy as np
import cv2

rng = np.random.default_rng(0)
base = cv2.GaussianBlur(rng.integers(0, 256, (140, 140), dtype=np.uint8), (5, 5), 0)
prev = base[10:130, 10:130].copy()
curr = base[7:127, 6:126].copy()                     # 내용이 오른쪽 4, 아래 3 이동

p0 = cv2.goodFeaturesToTrack(prev, maxCorners=50, qualityLevel=0.01, minDistance=7)
p1, st, err = cv2.calcOpticalFlowPyrLK(prev, curr, p0, None, winSize=(15, 15), maxLevel=2,
                                       criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
good_old, good_new = p0[st == 1], p1[st == 1]
d = good_new - good_old
print(p0.shape, int(st.sum()))                       # (50, 1, 2) 50  추적 성공 점 수
print(np.round(np.median(d, axis=0), 1).tolist())    # [4.0, 3.0]  (u, v)

# 최소제곱 직접 풀기 (한 점, 15×15 창)
f0, f1 = prev.astype(np.float32), curr.astype(np.float32)
Ix = cv2.Sobel(f0, cv2.CV_32F, 1, 0, ksize=3) / 8; Iy = cv2.Sobel(f0, cv2.CV_32F, 0, 1, ksize=3) / 8
x0, y0 = 60, 60
c1 = base[10 + 0:130, 10 - 1:130 - 1].astype(np.float32)   # 1픽셀 이동(작은 움직임)
w = np.s_[y0 - 7:y0 + 8, x0 - 7:x0 + 8]
A = np.stack([Ix[w].ravel(), Iy[w].ravel()], 1); b = -(c1 - f0)[w].ravel()
print([round(float(t), 1) for t in np.linalg.lstsq(A, b, rcond=None)[0]])   # [1.1, 0.0]  ≈ 실제 (1, 0)
```

## 관련 개념
[[Optical Flow 개념]] · [[Shi-Tomasi]] · [[Dense Optical Flow]] · [[Harris 코너 검출]] · [[동영상 처리]]
