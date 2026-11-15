---
title: Smooth L1 Loss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 객체검출]
---
# Smooth L1 Loss

## 정의·핵심
- **정의**: L1(MAE)의 **0 근처 꺾인 부분을 2차 곡선으로 부드럽게** 만든 손실. `nn.SmoothL1Loss(beta=1.0)`
- **Huber와의 관계**: 모양이 같고 스케일만 다르다 → `SmoothL1(beta) = Huber(delta=beta) / beta`. **beta=1이면 Huber(δ=1)와 완전히 같다**
  - |e| < β: `0.5·e²/β`
  - |e| ≥ β: `|e| − 0.5β`
  - Huber는 큰 오차의 기울기가 δ, Smooth L1은 **항상 1** (β와 무관)
- **대표 사용처 — 객체 검출 박스 회귀**: Fast/Faster R-CNN, SSD의 위치 손실(Localization Loss)
  - 박스 좌표 오차는 학습 초기에 매우 크다 → L2를 쓰면 기울기 폭주 / L1은 0 근처에서 불안정 → Smooth L1이 둘의 장점
  - SSD Loss = Confidence Loss(CE) + α·**Localization Loss(Smooth L1)** → [[SSD Loss]]
- 이후 검출 모델(YOLOv5 이후)은 박스 손실로 IoU 계열(GIoU, CIoU)을 주로 쓴다 → [[DIoU·CIoU]]

## 수식·원리
```
SmoothL1_β(e) = 0.5e²/β     (|e| < β)
              = |e| − 0.5β  (|e| ≥ β)
SmoothL1_β = Huber_β / β
```

## 코드 예시
```python
import torch
import torch.nn as nn

pred = torch.tensor([0.2, 0.8, 3.0]); target = torch.zeros(3)
s1 = nn.SmoothL1Loss(beta=1.0, reduction="none")(pred, target)
hb = nn.HuberLoss(delta=1.0, reduction="none")(pred, target)
print([round(v, 3) for v in s1.tolist()], torch.allclose(s1, hb))      # [0.02, 0.32, 2.5] True

s2 = nn.SmoothL1Loss(beta=2.0, reduction="none")(pred, target)
h2 = nn.HuberLoss(delta=2.0, reduction="none")(pred, target)
print(torch.allclose(s2, h2 / 2.0))                                    # True
```

## 관련 개념
[[Huber Loss]] · [[MAE(L1Loss)]] · [[SSD Loss]] · [[Bounding Box Regression]] · [[Faster R-CNN]]
