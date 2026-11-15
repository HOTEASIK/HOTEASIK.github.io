---
title: Shi-Tomasi
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 특징검출, 코너, OpenCV, AI응용]
---
# Shi-Tomasi

## 정의·핵심
- **정의**: Shi & Tomasi(1994) "Good Features to Track". Harris를 개선한 코너 검출 — 응답을 **두 고유값 중 작은 값** `R = min(λ₁, λ₂)` 으로 정의 (응용 3차시 "시-토마스 알고리즘")
- **Harris와 차이**
  - Harris: `R = λ₁λ₂ − k(λ₁+λ₂)²` (k 값에 결과가 좌우됨)
  - Shi-Tomasi: **min(λ₁, λ₂) > 임계값**이면 코너 → 두 방향 모두 확실히 변해야 함 → 더 **안정적이고 추적에 적합**
- **OpenCV: `cv2.goodFeaturesToTrack(gray, maxCorners, qualityLevel, minDistance, mask=None, blockSize=3)`**
  - `maxCorners`: 최대 개수 (강한 순서로)
  - `qualityLevel`: 최고 응답 대비 비율(0.01 = 최고의 1% 이상만)
  - `minDistance`: 코너 사이 최소 거리(px) → 한 곳에 몰리지 않게 (내부적으로 NMS)
  - `useHarrisDetector=True`로 Harris 방식도 선택 가능
  - 반환: `(N, 1, 2)` **float32** 좌표 (x, y) — 바로 Optical Flow 입력으로 사용
- **대표 사용처: Lucas-Kanade 추적의 시작점**
  - 첫 프레임에서 `goodFeaturesToTrack`으로 특징점 → `calcOpticalFlowPyrLK`로 다음 프레임 위치 추적 (응용 4차시 sparse optical flow 실습) → [[Lucas-Kanade(Sparse Optical Flow)]]
  - 강의: "특징자 검출기로 의미 있는 특징점을 추출하고 Optical Flow와 결합해 강건한 객체 추적"
- `mask`로 관심 영역 안에서만 검출 가능 (예: 추적할 물체 박스 안)

## 수식·원리
```
R = min(λ₁, λ₂)
선택 조건: R ≥ qualityLevel · max(R),  서로 minDistance 이상 떨어짐,  상위 maxCorners개
```

## 코드 예시
```python
import numpy as np
import cv2

img = np.zeros((80, 120), np.uint8)
cv2.rectangle(img, (10, 10), (50, 50), 255, -1)
cv2.rectangle(img, (70, 20), (110, 60), 160, -1)
pts = cv2.goodFeaturesToTrack(img, maxCorners=20, qualityLevel=0.1, minDistance=5)
print(pts.shape, pts.dtype)                                     # (8, 1, 2) float32  사각형 2개 × 꼭짓점 4
print(sorted(tuple(map(int, p)) for p in pts.reshape(-1, 2))[:4])   # [(10, 10), (10, 50), (50, 10), (50, 50)]  첫 사각형 꼭짓점
few = cv2.goodFeaturesToTrack(img, maxCorners=3, qualityLevel=0.1, minDistance=5)
print(len(few))                                                 # 3  maxCorners 제한
mask = np.zeros_like(img); mask[:, 60:] = 255
print(len(cv2.goodFeaturesToTrack(img, 20, 0.1, 5, mask=mask)))   # 4  오른쪽 사각형만
```

## 관련 개념
[[Harris 코너 검출]] · [[Lucas-Kanade(Sparse Optical Flow)]] · [[Optical Flow 개념]] · [[특징점·디스크립터 매칭]]
