---
title: Sliding Window
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, AI응용]
---
# Sliding Window

## 정의·핵심
- **정의**: **고정 크기의 창(Window)을 이미지 위에서 일정 간격으로 이동**시키며, 창 안의 영역마다 분류기를 돌려 객체가 있는지 판단하는 방식. **객체 검출의 초기 기법** (응용 11차시)
- **두 가지 방식 (강의)**
  1. **다양한 형태(크기·비율)의 window**를 각각 sliding
  2. **window 크기는 고정**하고, **크기를 바꾼 여러 이미지(이미지 피라미드)** 에서 sliding
- **대표 사례**: HOG + SVM 보행자 검출(Dalal & Triggs 2005), Viola-Jones 얼굴 검출, DPM → [[HOG(Histogram of Oriented Gradients)]], [[DPM(언급)]]
- **한계 (강의)**
  - 객체가 **없는 영역도 전부** sliding → 대부분이 **배경**, 연산 낭비
  - 여러 형태의 window / scale을 모두 고려해야 함 → **계산량 폭증**
  - 창 위치·크기가 격자에 묶여 박스가 부정확
- **발전**
  - 후보만 골라보자 → **Region Proposal** (Selective Search) → R-CNN → [[Selective Search·Region Proposal]]
  - CNN 자체가 sliding window를 **합성곱으로 한 번에** 계산 (OverFeat) → 특징 맵의 각 위치가 하나의 window 역할 → YOLO·SSD·RPN의 **격자·앵커 예측**으로 이어짐

## 수식·원리
```
창 개수 (한 스케일) = ((W − w)/s + 1) × ((H − h)/s + 1)
전체 = Σ_스케일 Σ_창형태 위 값      → 매우 큼
합성곱 = 커널을 sliding한 것 → FC를 conv로 바꾸면 모든 창을 한 번에 계산
```

## 코드 예시
```python
import numpy as np

def sliding_windows(H, W, win, step):
    for y in range(0, H - win[1] + 1, step):
        for x in range(0, W - win[0] + 1, step):
            yield x, y, win[0], win[1]

img = np.zeros((120, 160)); img[40:80, 60:100] = 1           # 40x40 객체
best = max(sliding_windows(120, 160, (40, 40), 10), key=lambda b: img[b[1]:b[1] + 40, b[0]:b[0] + 40].sum())
print(best)                                                  # (60, 40, 40, 40)  가장 반응이 큰 창

total = 0
for scale in (1.0, 0.75, 0.5):                               # 이미지 피라미드
    H, W = int(480 * scale), int(640 * scale)
    for win in ((64, 128), (64, 64), (128, 64)):             # 여러 형태의 창
        total += sum(1 for _ in sliding_windows(H, W, win, 8))
print(total)                                                 # 17742  대부분 배경, 계산량 폭증
```

## 관련 개념
[[Selective Search·Region Proposal]] · [[객체 검출의 어려움]] · [[HOG(Histogram of Oriented Gradients)]] · [[R-CNN]] · [[Anchor Box(Default Box)]]
