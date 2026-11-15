---
title: 히스토그램 평활화(Equalization)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 히스토그램, OpenCV, AI응용]
---
# 히스토그램 평활화(Equalization)

## 정의·핵심
- **정의**: 픽셀 값 분포를 전체 범위에 걸쳐 **수학적으로 재배치해 균등하게** 만드는 기법 (응용 1차시)
- **목적 (강의)**: **명암 대비 향상** — 한쪽으로 치우친 분포를 넓게 펼쳐, 특히 **어두운 영역에 묻혀 있던 디테일**을 선명하게
  - 예시 1: **역광 사진 보정** — 검게 나온 피사체를 드러냄
  - 예시 2: **안개 낀 풍경** — 뿌옇고 대비가 낮은 사진을 또렷하게
- **원리**: **누적 분포 함수(CDF)** 를 변환 함수로 사용
  - 많이 몰려 있는 밝기 구간은 **넓게 벌리고**, 드문 구간은 좁힘
  - 결과 히스토그램이 완전히 평평하지는 않지만 누적분포가 **직선(균등)** 에 가까워짐
- **OpenCV**
  - `cv2.equalizeHist(gray)`: **8bit 단일 채널**만 가능
  - **컬러 영상**: BGR 각 채널을 따로 평활화하면 **색이 틀어진다** → **YCrCb의 Y** 또는 **HSV의 V**만 평활화 후 merge → [[split·merge]]
- **CLAHE (Contrast Limited Adaptive HE)**: `cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)`
  - 영상을 **타일로 나눠 지역별로** 평활화 + 히스토그램 **상한(clip)** 으로 잡음 증폭 억제
  - 전역 평활화는 하늘·배경 잡음을 과하게 키우거나 일부를 날려버림 → CLAHE가 더 자연스럽다
  - **의료영상(X-ray)·저조도 영상** 전처리에 많이 쓰임
- **정규화와 비교**: 정규화는 선형 늘리기(모양 유지), 평활화는 비선형(모양을 균등 쪽으로) → [[히스토그램 정규화]]

## 수식·원리
```
cdf(k) = Σ_{j≤k} h(j)
dst(x, y) = round( (cdf(I(x,y)) − cdf_min) / (N − cdf_min) · 255 )    (N = 전체 픽셀 수)
```

## 코드 예시
```python
import numpy as np
import cv2

rng = np.random.default_rng(0)
dark = np.clip(rng.normal(50, 10, (100, 100)), 0, 255).astype(np.uint8)    # 어둡고 대비 낮음
eq = cv2.equalizeHist(dark)
print(dark.min(), dark.max(), eq.min(), eq.max())                # 11 84 0 255  범위가 0~255로 넓어짐
print(round(dark.std(), 1), round(eq.std(), 1))                   # 10.0 73.6  표준편차(대비) 크게 증가

hist = np.bincount(dark.ravel(), minlength=256)
cdf = hist.cumsum()
cmin = cdf[cdf > 0][0]
lut = np.round((cdf - cmin) / (dark.size - cmin) * 255).clip(0, 255).astype(np.uint8)
print(np.abs(lut[dark].astype(int) - eq).max() <= 1)              # True  CDF 공식과 같음

clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
print(clahe.apply(dark).std() < eq.std())                         # True  CLAHE는 더 부드럽게
color = cv2.merge([dark, dark, dark])
ycc = cv2.cvtColor(color, cv2.COLOR_BGR2YCrCb)
ycc[..., 0] = cv2.equalizeHist(ycc[..., 0])                       # 컬러는 Y(밝기)만
print(cv2.cvtColor(ycc, cv2.COLOR_YCrCb2BGR).shape)               # (100, 100, 3)
```

## 관련 개념
[[히스토그램]] · [[히스토그램 정규화]] · [[split·merge]] · [[밝기·대비 조절]] · [[의료영상 AI 개요]]
