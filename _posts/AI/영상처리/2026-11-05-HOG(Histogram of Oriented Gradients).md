---
title: HOG(Histogram of Oriented Gradients)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 특징검출, 대학원, AI응용]
---
# HOG(Histogram of Oriented Gradients)

## 정의·핵심
- **정의**: 영상을 작은 셀로 나누고 각 셀의 **기울기 방향 히스토그램**을 모아 만든 **특징 기술자(descriptor)**. Dalal & Triggs(2005) "Histogram of Oriented Gradients for Human Detection" — **HOG + 선형 SVM으로 보행자 검출** (대학원 04 논문 리뷰)
- **아이디어**: 물체의 모양은 **엣지 방향의 분포**로 잘 표현된다. 정확한 위치보다 "이 부근에 어떤 방향의 엣지가 많은가"를 기록 → 작은 변형·조명에 강함
- **추출 단계 (대학원 04, 96×160 보행자 창 기준)**
  1. **기울기 계산**: 평활화 없이 **중앙 차분 `[-1, 0, 1]`** 로 dx, dy (컬러면 기울기가 가장 큰 채널)
  2. **크기·방향**: `s = √(dx² + dy²)`, `θ = arctan(dy/dx)` — 예: dx=1, dy=5 → s=5.1, θ=78.7°
  3. **셀 히스토그램 (Orientation Binning)**: **8×8 셀**마다 방향을 **9개 구간(0~180°, 20° 간격)** 으로 나눠 **크기를 투표**. 이웃 구간에 **선형 보간**으로 나눠 투표 (예: 85° → 70°와 90° 구간 중심까지 15°, 5° → 크기의 1/4, 3/4)
  4. **블록 정규화**: **2×2 셀 = 16×16 블록**, **50% 겹치게** 이동 → 블록당 4×9 = **36차원**을 정규화 (조명·대비 변화에 강하게)
  5. **연결**: 96×160 → 블록 11×19 = **209개** → **209 × 4 × 9 = 7,524차원** 특징 벡터
- **분류**: 7,524차원 HOG 벡터로 **선형 SVM**(C = 0.01, soft margin) 학습 → 슬라이딩 윈도우로 이미지 전체를 훑으며 사람/비사람 판정
- **CNN과 비교 (대학원 05)**: 전통 방식은 **사람이 설계한 특징(HOG) + 학습되는 분류기(SVM)**, CNN은 **특징까지 학습**
- **OpenCV**: `cv2.HOGDescriptor()` (기본 64×128 창, 3,780차원), `hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())` + `detectMultiScale`로 보행자 검출. scikit-image `feature.hog`
- 현재는 딥러닝 검출기에 밀렸지만, 가볍고 해석이 쉬워 임베디드·교육용으로 쓰인다

## 수식·원리
```
s = √(dx² + dy²),  θ = arctan(dy / dx) ∈ [0°, 180°)  (unsigned)
셀 8×8 → 9-bin 히스토그램,  블록 2×2 셀 → 36차원 → L2-Hys 정규화
96×160: (96/8 − 1) × (160/8 − 1) = 11 × 19 = 209 블록 → 209·36 = 7524
```

## 코드 예시
```python
import numpy as np
import cv2

hog = cv2.HOGDescriptor((96, 160), (16, 16), (8, 8), (8, 8), 9)   # 창, 블록, 블록 이동, 셀, bin 수
img = np.zeros((160, 96), np.uint8)
cv2.ellipse(img, (48, 80), (25, 60), 0, 0, 360, 255, -1)        # 사람 비슷한 세로 타원
feat = hog.compute(img)
print(feat.shape, 11 * 19 * 4 * 9)                              # (7524,) 7524

dx, dy = 1, 5                                                   # 강의 예시 픽셀
print(round(np.hypot(dx, dy), 1), round(np.degrees(np.arctan2(dy, dx)), 1))   # 5.1 78.7

theta, mag = 85.0, 1.0                                          # 85°를 20° 간격 bin에 보간 투표
centers = np.arange(10, 180, 20)                                # 10, 30, …, 170
lo = int((theta - 10) // 20); w_hi = (theta - centers[lo]) / 20
print(centers[lo], round(mag * (1 - w_hi), 2), centers[lo + 1], round(mag * w_hi, 2))   # 70 0.25 90 0.75
default = cv2.HOGDescriptor()
print(default.getDescriptorSize())                              # 3780  (기본 64x128 창)
```

## 관련 개념
[[Sobel 필터]] · [[차분(Differencing)]] · [[히스토그램]] · [[Feature Extractor·Classifier 구조]]
