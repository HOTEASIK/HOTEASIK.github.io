---
title: L2 규제(Ridge, weight_decay)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 규제, 과적합]
---
# L2 규제(Ridge, weight_decay)

## 정의·핵심
- **정의**: 손실에 **가중치 제곱합 × λ**를 더해서 가중치가 커지지 못하게 누르는 규제. 선형회귀에 적용하면 **Ridge 회귀**, 딥러닝 옵티마이저에서는 **weight_decay** 인자
- **왜 과적합을 막나**: 과적합된 모델은 잡음까지 맞추려고 **일부 가중치가 매우 커지는** 경향이 있다. 큰 가중치에 벌점을 주면 모델이 더 **부드럽고 단순한 함수**를 택한다
- **weight decay라는 이름**: L2 항의 기울기 `2λW`가 업데이트마다 가중치를 **일정 비율로 줄인다(감쇠)** → `W ← (1 − ηλ')W − η∇L`
- **특징**
  - 가중치를 **0 쪽으로 작게** 만들지만 **정확히 0으로 만들지는 않는다** (L1과 차이) → [[L1 규제(Lasso)]]
  - 상관된 특징들에 가중치를 고르게 나눠 준다
- **PyTorch 사용**
  - `optim.SGD(params, lr=0.01, weight_decay=1e-4)` / `optim.AdamW(params, weight_decay=0.01)`
  - SGD의 weight_decay = 손실에 `(λ/2)‖W‖²` 추가와 같다. Adam에서는 다르게 동작하므로 **AdamW 권장** → [[AdamW]]
  - 흔한 값: CNN 1e-4 ~ 5e-4, Transformer(AdamW) 0.01 ~ 0.1
- **sklearn**: `Ridge(alpha=λ)`, `LogisticRegression(C=1/λ)` (기본이 L2 규제)

## 수식·원리
```
L_total = L_data + λ Σ wᵢ²
∂L_total/∂w = ∂L_data/∂w + 2λw
Ridge 해: w = (XᵀX + λI)⁻¹ Xᵀy
```

## 코드 예시
```python
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge

rng = np.random.default_rng(0)
x = rng.normal(size=(20, 1))
X = np.hstack([x, x + rng.normal(0, 0.01, (20, 1))])     # 거의 같은 특징 2개
y = 3 * x[:, 0] + rng.normal(0, 0.1, 20)
print(np.round(LinearRegression().fit(X, y).coef_, 1))  # [ 7.4 -4.4]  큰 값이 서로 상쇄 (불안정)
print(np.round(Ridge(alpha=1.0).fit(X, y).coef_, 1))     # [1.5 1.5]  ← 작고 고르게 나눔

import torch
w = torch.tensor([10.0], requires_grad=True)
opt = torch.optim.SGD([w], lr=0.1, weight_decay=0.5)
(0 * w).sum().backward(); opt.step()
print(round(w.item(), 2))                                 # 9.5  = 10 − 0.1 × 0.5 × 10 (감쇠)
```

## 관련 개념
[[L1 규제(Lasso)]] · [[ElasticNet]] · [[AdamW]] · [[과적합(Overfitting)]] · [[선형회귀]]
