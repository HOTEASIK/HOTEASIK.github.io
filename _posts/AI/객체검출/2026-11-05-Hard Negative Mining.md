---
title: Hard Negative Mining
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, SSD, 클래스불균형, AI응용]
---
# Hard Negative Mining

## 정의·핵심
- **정의**: 수많은 Negative(배경) 샘플 중 **모델이 가장 헷갈려 하는(손실이 큰) Negative만 골라** 학습에 사용하는 샘플링 전략. **클래스 불균형(Class Imbalance)** 해결용 (응용 13차시)
- **왜 필요한가 (강의)**
  - 이미지 내 객체(Positive)보다 **배경(Negative)이 압도적으로 많음** — SSD는 8,732개 박스 중 양성이 보통 수십 개 미만
  - **모든 배경을 학습하면** 손실이 쉬운 배경에 묻혀 **모델이 배경만 잘 맞추고 객체는 못 찾는** 문제
  - 쉬운 Negative(빈 하늘·벽)는 이미 맞추므로 학습에 기여가 거의 없음
- **핵심 알고리즘 (강의)**
  1. **모든 Negative Box의 Confidence Loss** 계산 (배경 클래스에 대한 CE)
  2. Loss가 **높은(맞추기 어려운) 순서로 내림차순** 정렬
  3. **Positive 개수의 3배**만큼 상위 Negative 선택 → **Negative : Positive = 3 : 1**
  - 선택된 Negative + 모든 Positive로만 Confidence Loss 계산
- **효과**: 최적화가 빠르고 안정적, 오탐(FP)을 줄이는 데 효과적 (배경과 비슷한 어려운 사례 집중 학습)
- **역사·비교**
  - 원래 HOG+SVM, R-CNN(SVM 학습) 시절부터 쓰던 기법 (부트스트래핑)
  - **OHEM**(Online Hard Example Mining, 2016): 양성·음성 구분 없이 손실 큰 RoI 선택
  - **Focal Loss**(RetinaNet): 샘플을 고르는 대신 **쉬운 샘플의 손실 가중치를 자동으로 낮춤** → 모든 샘플 사용, 비율 하이퍼파라미터 불필요 → [[RetinaNet(언급)]]
  - YOLO v8: Focal류 가중 + Task-Aligned 할당 → [[YOLO v8]]
- 일반 분류의 [[클래스 불균형 문제]]에서 언더샘플링을 "어려운 것 위주"로 하는 것과 같은 발상

## 수식·원리
```
neg_loss_i = −log ĉ_i^0     (i ∈ Neg)
선택 = top_k(neg_loss),  k = min(3·N_pos, N_neg)
L_conf = Σ_{Pos} CE + Σ_{선택된 Neg} CE
```

## 코드 예시
```python
import torch
import torch.nn.functional as F

torch.manual_seed(0)
n_box, n_cls = 8732, 21
conf = torch.randn(n_box, n_cls)
conf[:, 0] += 4                                              # 대부분 배경으로 쉽게 예측됨
labels = torch.zeros(n_box, dtype=torch.long)
labels[torch.randperm(n_box)[:12]] = torch.randint(1, n_cls, (12,))   # 양성 12개
pos = labels > 0
loss = F.cross_entropy(conf, labels, reduction="none")
neg_loss = loss.clone(); neg_loss[pos] = 0
k = 3 * int(pos.sum())
hard_neg = neg_loss.topk(k).indices                          # 손실 큰 Negative 상위 3배
print(int(pos.sum()), k, int((~pos).sum()))                  # 12 36 8720
print(round(loss[hard_neg].mean().item(), 3) > round(loss[~pos].mean().item(), 3))   # True  어려운 것만 선택
L_conf = (loss[pos].sum() + loss[hard_neg].sum()) / pos.sum()
print(round(L_conf.item(), 2) > 0)                           # True
```

## 관련 개념
[[SSD Loss]] · [[SSD]] · [[Default Box Matching]] · [[RetinaNet(언급)]] · [[클래스 불균형 문제]]
