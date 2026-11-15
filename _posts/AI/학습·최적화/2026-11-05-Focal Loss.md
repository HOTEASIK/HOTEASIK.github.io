---
title: Focal Loss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 클래스불균형, 객체검출]
---
# Focal Loss

## 정의·핵심
- **정의**: **이미 잘 맞히는 쉬운 샘플의 손실은 줄이고, 틀리는 어려운 샘플에 집중**하도록 CE에 `(1 − p_t)^γ`를 곱한 손실. RetinaNet 논문(2017)에서 제안 (개론 6차시)
- **해결하는 문제**: 객체 검출에서는 배경 박스(쉬운 음성)가 물체 박스보다 **수천 배** 많다. 하나하나 손실은 작아도 개수가 많아 **전체 손실을 지배** → 모델이 배경 맞히기만 배운다
- **두 가지 장치**
  - **γ (focusing parameter)**: `(1 − p_t)^γ` — 정답 확률 p_t가 높을수록(쉬움) 손실을 크게 줄인다
    - p_t = 0.9, γ=2 → 손실 × 0.01 (100배 감소) / p_t = 0.1 → × 0.81 (거의 그대로)
    - γ = 0이면 일반 CE
  - **α (class balance)**: 양성·음성 클래스 비율 보정 가중치
  - **표준 설정 γ=2, α=0.25** (강의)
- **효과**: 극심한 불균형(**1:100 이상**)에 효과적, **객체 탐지·의미론적 분할**에서 자주 사용 → [[RetinaNet(언급)]]
- **Weighted CE와 차이**: Weighted CE는 **클래스 단위**로 고정 가중치, Focal은 **샘플마다 난이도**에 따라 동적으로 가중
- PyTorch 기본 손실에는 없고 `torchvision.ops.sigmoid_focal_loss`로 제공

## 수식·원리
```
p_t = p (y=1),  1−p (y=0)
CE    = −log(p_t)
Focal = −α_t · (1 − p_t)^γ · log(p_t)
```

## 코드 예시
```python
import torch
from torchvision.ops import sigmoid_focal_loss
import torch.nn.functional as F

logits = torch.tensor([2.2, -2.2])          # p ≈ 0.9, 0.1
y = torch.tensor([1.0, 1.0])                # 둘 다 정답 1 → 쉬운 샘플, 어려운 샘플
ce = F.binary_cross_entropy_with_logits(logits, y, reduction="none")
fl = sigmoid_focal_loss(logits, y, alpha=-1, gamma=2.0, reduction="none")   # alpha=-1: α 끄기
print([round(v, 4) for v in ce.tolist()])   # [0.1051, 2.3051]
print([round(v, 4) for v in fl.tolist()])   # [0.001, 1.8682]  쉬운 샘플은 약 100배 감소
p = torch.sigmoid(logits)
print(torch.allclose(fl, (1 - p) ** 2 * ce))  # True
```

## 관련 개념
[[Weighted Cross Entropy]] · [[클래스 불균형 문제]] · [[RetinaNet(언급)]] · [[BCEWithLogitsLoss]] · [[Hard Negative Mining]]
