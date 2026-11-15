---
title: Huber Loss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 회귀, AI개론]
---
# Huber Loss

## 정의·핵심
- **정의**: **작은 오차에는 MSE처럼, 큰 오차에는 MAE처럼** 동작하는 손실함수. "MSE와 MAE의 절충안", "영리한 손실함수" (개론 6차시) `nn.HuberLoss(delta=1.0)`
- **δ(delta)**: 두 방식을 전환하는 **경계값 하이퍼파라미터**
  - |오차| ≤ δ: `½·오차²` (MSE 영역) → 0 근처가 매끄러워 미분 가능, 수렴이 부드럽다
  - |오차| > δ: `δ·(|오차| − ½δ)` (MAE 영역) → 선형으로 증가해 이상치 영향 제한
  - δ가 크면 MSE에 가깝고, 작으면 MAE에 가깝다. 보통 1.0. 데이터의 "정상 오차 범위" 정도로 잡는다
- **장점 결합**
  - MSE의 장점: 0 근처 미분 가능, 최솟값 근처에서 기울기가 줄어듦
  - MAE의 장점: 이상치에 강건 (기울기 크기가 최대 δ로 제한)
- **쓰이는 곳**: 이상치가 섞인 회귀, **DQN**(강화학습 TD 오차, 기울기 폭주 방지), 객체 검출 박스 회귀
- `delta=1`인 Huber는 Smooth L1과 같다 → [[Smooth L1 Loss]]

## 수식·원리
```
L_δ(e) = ½e²             (|e| ≤ δ)
       = δ(|e| − ½δ)     (|e| > δ)
기울기  = e (작은 오차),  δ·sign(e) (큰 오차)   → 최대 δ로 제한
```

## 코드 예시
```python
import torch
import torch.nn as nn

e = torch.tensor([0.5, 1.0, 3.0, 10.0], requires_grad=True)
h = nn.HuberLoss(delta=1.0, reduction="none")(e, torch.zeros(4))
print(h.tolist())                                  # [0.125, 0.5, 2.5, 9.5]
h.sum().backward()
print(e.grad.tolist())                             # [0.5, 1.0, 1.0, 1.0]  ← 큰 오차의 기울기는 δ로 제한
print([round(v, 3) for v in nn.HuberLoss(delta=5.0, reduction="none")(e.detach(), torch.zeros(4)).tolist()])
# [0.125, 0.5, 4.5, 37.5]  δ를 키우면 MSE에 가까워짐
```

## 관련 개념
[[MSE]] · [[MAE(L1Loss)]] · [[Smooth L1 Loss]] · [[DQN]] · [[이상치(Outlier)]]
