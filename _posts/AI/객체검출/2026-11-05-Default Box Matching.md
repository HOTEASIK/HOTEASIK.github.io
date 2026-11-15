---
title: Default Box Matching
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, SSD, 라벨할당, AI응용]
---
# Default Box Matching

## 정의·핵심
- **정의**: 학습 시 8,732개 Default Box 중 **어떤 박스가 어떤 Ground Truth를 담당할지(양성) 결정**하는 과정. 이미지에는 GT가 보통 몇 개뿐이므로 이 규칙이 학습 신호를 결정 (응용 13차시)
- **2단계 매칭 전략 (강의)**
  - **Step 1 — Best Prior Matching**: **각 GT마다 IoU가 가장 높은 Default Box를 하나씩 우선 매칭** → **모든 실제 객체가 최소 하나의 박스와 반드시 연결**되도록 보장 (IoU가 0.5 미만이어도)
  - **Step 2 — Threshold Matching**: 남은 Default Box 중 **GT와 IoU ≥ 0.5인 모든 박스**를 추가 매칭 → **한 객체에 여러 박스**가 학습에 참여 → 예측 안정성 ↑
- **매칭 결과 (강의)**
  - 매칭된 박스 = **Positive** → 위치(Smooth L1)·클래스 학습
  - 매칭 안 된 박스 = **Negative(배경, 클래스 0)** → Hard Negative Mining으로 일부만 사용 → [[Hard Negative Mining]]
  - 기준: **IoU < 0.5 → Negative, IoU ≥ 0.5 → Positive**
- **다중 매칭 규칙 (강의)**
  - **하나의 GT ↔ 여러 Default Box** 가능 (높은 IoU 박스를 최대한 활용해 양성 샘플 확보)
  - **하나의 Default Box ↔ 오직 하나의 GT** (IoU가 가장 높은 GT)
- 매칭된 박스에 대해 **오프셋 타깃**(g와 d의 관계)을 인코딩 → [[SSD Loss]]
- 비교: Faster R-CNN RPN은 0.7/0.3 이중 임계값, YOLO v8은 Task-Aligned 동적 할당 → [[Task-Aligned Assignment]]

## 수식·원리
```
IoU 행렬 M (GT × Default):
Step 1: 각 GT g에 대해 d* = argmax_d M[g, d] → d*를 g에 강제 매칭
Step 2: 각 d에 대해 g' = argmax_g M[g, d];  M[g', d] ≥ 0.5 이면 d를 g'에 매칭
나머지 → 배경
```

## 코드 예시
```python
import torch
from torchvision.ops import box_iou

gt = torch.tensor([[100., 150., 300., 400.], [20., 20., 60., 50.]])       # GT 2개 (xyxy)
dboxes = torch.tensor([[95., 145., 305., 405.],   # 0: GT0과 거의 같음
                       [120., 160., 320., 380.],  # 1: GT0과 IoU ≥ 0.5
                       [0., 0., 50., 50.],        # 2: GT1과 IoU < 0.5 (가장 높음)
                       [200., 300., 260., 380.],  # 3: 겹침 적음
                       [400., 400., 450., 450.]]) # 4: 아무것과도 안 겹침
iou = box_iou(gt, dboxes)
print([[round(v, 2) for v in r] for r in iou.tolist()])   # [[0.92, 0.73, 0.0, 0.1, 0.0], [0.0, 0.0, 0.32, 0.0, 0.0]]

best_gt_iou, best_gt = iou.max(0)                  # 각 Default Box → 가장 높은 GT
best_prior = iou.argmax(1)                         # Step 1: 각 GT → 가장 높은 Default Box
for g, d in enumerate(best_prior.tolist()):
    best_gt[d] = g; best_gt_iou[d] = 2.0           # 강제 매칭
pos = best_gt_iou >= 0.5                           # Step 2: 임계값
labels = torch.where(pos, best_gt + 1, torch.zeros_like(best_gt))   # 0 = 배경
print(pos.tolist(), labels.tolist())               # [True, True, True, False, False] [1, 1, 2, 0, 0]  박스 2는 Step 1로 구제
```

## 관련 개념
[[SSD]] · [[IoU]] · [[Hard Negative Mining]] · [[SSD Loss]] · [[Task-Aligned Assignment]]
