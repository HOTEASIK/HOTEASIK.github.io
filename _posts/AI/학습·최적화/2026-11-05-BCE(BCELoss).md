---
title: BCE(BCELoss)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 이진분류, AI개론]
---
# BCE(BCELoss)

## 정의·핵심
- **정의**: Binary Cross Entropy, 이진 교차 엔트로피. **두 클래스(0 또는 1)** 를 분류할 때, 모델이 예측한 **확률 p(0~1)** 와 실제 레이블의 차이를 측정 (개론 6·8차시). `nn.BCELoss()`
- **동작 (강의 예)**
  - **정답이 1일 때** `BCE = −log(p)`: p=0.9 → 0.105(작음), p=0.5 → 0.693, p=0.1 → **2.303(큼)**
  - **정답이 0일 때** `BCE = −log(1−p)`: p=0.1 → 0.105, p=0.5 → 0.693, p=0.9 → 2.303
  - **확신하고 틀리면 손실이 폭발적으로 커진다** (p→0이면 −log p → ∞) → 강하게 교정
- **입력 조건**: `nn.BCELoss`는 **확률**을 받는다 → 모델 끝에 `Sigmoid`가 있어야 한다. 정답은 같은 모양의 **float** (`0.`/`1.`)
- **수치 불안정 문제**: Sigmoid 출력이 정확히 0 또는 1로 반올림되면 `log(0) = −inf`. PyTorch는 로그를 −100에서 잘라 버리지만 기울기 정보가 손실된다 → **실전에서는 `BCEWithLogitsLoss` 권장** → [[BCEWithLogitsLoss]]
- **왜 MSE가 아니라 BCE인가**: Sigmoid+MSE는 틀렸을 때 기울기가 오히려 작아져(포화) 학습이 느리다. Sigmoid+BCE는 기울기가 `p − y`로 깔끔해 틀릴수록 크게 교정
- 다중 라벨(한 샘플에 여러 라벨 동시 가능) 분류에도 클래스마다 BCE를 쓴다

## 수식·원리
```
BCE = −(1/N) Σ [ yᵢ·log(pᵢ) + (1−yᵢ)·log(1−pᵢ) ]
p = σ(z) 일 때 ∂BCE/∂z = p − y        (깔끔한 기울기)
```

## 코드 예시
```python
import torch
import torch.nn as nn

for p in [0.9, 0.5, 0.1]:
    l = nn.BCELoss()(torch.tensor([p]), torch.tensor([1.0]))
    print(p, round(l.item(), 3))                  # 0.9 0.105 / 0.5 0.693 / 0.1 2.303

z = torch.tensor([0.3], requires_grad=True); y = torch.tensor([1.0])
nn.BCELoss()(torch.sigmoid(z), y).backward()
print(round(z.grad.item(), 4), round((torch.sigmoid(z) - y).item(), 4))   # -0.4256 -0.4256  ← p − y

print(nn.BCELoss()(torch.tensor([0.0]), torch.tensor([1.0])).item())       # 100.0  ← log(0)을 −100으로 자름
```

## 관련 개념
[[BCEWithLogitsLoss]] · [[Sigmoid]] · [[로지스틱 회귀]] · [[CrossEntropyLoss]] · [[이진분류 출력과 임계값]]
