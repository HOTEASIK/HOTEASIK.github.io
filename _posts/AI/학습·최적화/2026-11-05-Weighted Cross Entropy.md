---
title: Weighted Cross Entropy
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 클래스불균형, AI개론]
---
# Weighted Cross Entropy

## 정의·핵심
- **정의**: 클래스마다 **다른 가중치**를 곱한 교차 엔트로피. **적은 클래스(소수 클래스)를 틀렸을 때 더 크게 벌점**을 줘서 클래스 불균형을 보정한다 (개론 6·10차시)
- **해결하는 문제**: 정상 9,900개(99%), 질병 100개(1%)일 때 "모두 정상"만 예측해도 정확도 99% → 쓸모없는 모델. 일반 CE는 다수 클래스 손실이 전체를 지배해서 소수 클래스를 무시하게 된다 → [[클래스 불균형 문제]]
- **다중분류: `class weight`**
  - `nn.CrossEntropyLoss(weight=torch.tensor([w₀, w₁, ...]))`
  - 보통 **클래스 빈도의 역수**: `wₖ = N / (K · Nₖ)` (sklearn `compute_class_weight('balanced')`와 같음)
  - `reduction='mean'`일 때 **가중 평균**(Σwℓ / Σw)이 된다
- **이진분류: `pos_weight`**
  - `nn.BCEWithLogitsLoss(pos_weight=torch.tensor([음성 수 / 양성 수]))`
  - **양성(1) 샘플의 손실에만** 곱해진다 → 재현율(Recall)↑, 정밀도↓ 경향 (8차시 사기 거래 탐지)
- **장단점**: 구현이 한 줄이고 데이터를 바꾸지 않는다 / 가중치를 너무 키우면 소수 클래스에 과적합, 쉬운 다수 샘플 손실이 여전히 많이 쌓임 → 극심한 불균형은 **Focal Loss** → [[Focal Loss]]
- 다른 방법: 오버샘플링·언더샘플링, `WeightedRandomSampler` → [[오버샘플링·언더샘플링]]

## 수식·원리
```
WCE = − Σᵢ w_yᵢ · log p(yᵢ) / Σᵢ w_yᵢ          (mean)
wₖ = N / (K · Nₖ)                               (balanced)
pos_weight = N_neg / N_pos
```

## 코드 예시
```python
import torch
import torch.nn as nn

counts = torch.tensor([900.0, 90.0, 10.0])
w = counts.sum() / (len(counts) * counts)
print([round(v, 2) for v in w.tolist()])                     # [0.37, 3.7, 33.33]

z = torch.tensor([[2.0, 0.5, 0.1], [0.3, 0.2, 1.5]]); y = torch.tensor([0, 2])
plain = nn.CrossEntropyLoss(reduction="none")(z, y)
wce = nn.CrossEntropyLoss(weight=w)(z, y)
print(torch.allclose(wce, (plain * w[y]).sum() / w[y].sum()))   # True  가중 평균

pos, neg = 50, 950
crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([neg / pos]))
print(round(crit(torch.tensor([0.0]), torch.tensor([1.0])).item(), 2))   # 13.17 = 19 × 0.693
```

## 관련 개념
[[클래스 불균형 문제]] · [[Focal Loss]] · [[클래스 가중치]] · [[CrossEntropyLoss]] · [[BCEWithLogitsLoss]]
