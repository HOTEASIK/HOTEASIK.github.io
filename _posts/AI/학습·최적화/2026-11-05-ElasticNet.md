---
title: ElasticNet
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 규제, 과적합]
---
# ElasticNet

## 정의·핵심
- **정의**: **L1 규제와 L2 규제를 섞은** 규제. 두 항을 비율로 함께 더한다
- **왜 섞나**
  - L1(Lasso)의 장점: 불필요한 특징을 **0으로** → 특징 선택
  - L1의 약점: 서로 상관이 높은 특징들 중 **하나만 무작위로 남기고** 나머지를 버려 불안정, 특징 수 > 샘플 수일 때 최대 샘플 수만큼만 선택
  - L2(Ridge)의 장점: 상관된 특징에 가중치를 **고르게 나눔**, 안정적
  - ElasticNet = **희소성 + 그룹 효과(상관 특징을 함께 남김)**
- **sklearn 인자**: `ElasticNet(alpha=전체 강도, l1_ratio=L1 비율)`
  - `l1_ratio=1` → Lasso, `l1_ratio=0` → Ridge, 0.5 → 반반
  - 둘 다 하이퍼파라미터라 `ElasticNetCV`로 교차검증 탐색
- **딥러닝에서는**: 손실에 두 항을 직접 더하거나, L2는 weight_decay로 L1만 손실에 추가

## 수식·원리
```
sklearn:  L = (1/2n)‖y − Xw‖² + α·l1_ratio·‖w‖₁ + (α/2)(1 − l1_ratio)·‖w‖₂²
```

## 코드 예시
```python
import numpy as np
from sklearn.linear_model import ElasticNet, Lasso

rng = np.random.default_rng(1)
z = rng.normal(size=(100, 1))
X = np.hstack([z + rng.normal(0, 0.05, (100, 1)) for _ in range(3)] + [rng.normal(size=(100, 3))])
y = 3 * z[:, 0] + rng.normal(0, 0.3, 100)                     # 앞 3개는 같은 신호(상관 높음)
print(np.round(Lasso(alpha=0.1).fit(X, y).coef_, 2))          # [0.25 0.95 1.7 -0. 0. 0.]  상관 특징 중 일부에 몰아줌
print(np.round(ElasticNet(alpha=0.1, l1_ratio=0.3).fit(X, y).coef_, 2))   # [0.95 0.97 0.99 -0. 0.01 -0.]  고르게 분배, 뒤 3개 ≈ 0
```

## 관련 개념
[[L1 규제(Lasso)]] · [[L2 규제(Ridge, weight_decay)]] · [[과적합(Overfitting)]]
