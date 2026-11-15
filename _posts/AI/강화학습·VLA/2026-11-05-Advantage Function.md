---
title: Advantage Function
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 정책기반, Advantage, AI응용]
---
# Advantage Function

## 정의·핵심
- **정의 (응용 15차시)**: `A(s, a) = Q(s, a) − V(s)` — 상태 s에서 행동 a가 **평균적인 행동보다 얼마나 더 좋은가**
  - **A > 0**: 평균보다 좋은 행동 → 확률을 **높임**
  - **A < 0**: 평균보다 나쁜 행동 → 확률을 **낮춤**
  - **A = 0**: 평균 수준
- **강의 예시**: V(s) = 100 (이 상태의 평균 기대치)
  - 행동 A의 Q = 110 → **A = +10** (좋은 행동)
  - 행동 B의 Q = 90 → **A = −10** (나쁜 행동)
  - 리턴 자체(110, 90 둘 다 양수)를 쓰면 둘 다 확률을 올리지만, Advantage는 **상대적 좋고 나쁨**을 바로 알려 줌
- **Baseline과의 관계**: V(s)를 Baseline으로 쓴 것 = Advantage → 분산 감소 + 무편향 → [[Baseline]]
- **성질**: `E_{a~π}[A(s, a)] = 0` (정책 하의 평균 행동의 Advantage는 0)
- **실제로는 Q, V를 둘 다 학습하지 않고 추정**: `A ≈ r + γV(s') − V(s)` (TD error), 또는 n-step, **GAE** → [[Advantage 추정]]
- **쓰이는 곳**: Actor-Critic, **A2C**(이름 자체가 Advantage Actor-Critic), **PPO**(clipped objective에 A 사용) → [[A2C]], [[PPO]] / Dueling DQN도 Q = V + A로 분해

## 수식·원리
```
A^π(s, a) = Q^π(s, a) − V^π(s)
E_{a~π(·|s)}[ A^π(s, a) ] = 0
∇_θ J = E[ ∇_θ log π_θ(a|s) · A(s, a) ]
TD 추정:  A(s_t, a_t) ≈ δ_t = r_{t+1} + γ V(s_{t+1}) − V(s_t)
```

## 코드 예시
```python
import numpy as np

V = 100.0                                           # 강의 예시
Q = {"A": 110.0, "B": 90.0}
print({k: q - V for k, q in Q.items()})             # {'A': 10.0, 'B': -10.0}

pi = np.array([0.5, 0.5])                           # 정책 하에서 Advantage 평균 = 0
Qs = np.array([110.0, 90.0])
Vs = (pi * Qs).sum()
print(Vs, float((pi * (Qs - Vs)).sum()))            # 100.0 0.0

pi2 = np.array([0.8, 0.2])                          # 정책이 바뀌면 V와 A도 바뀜
V2 = (pi2 * Qs).sum()
print(round(V2, 1), (Qs - V2).round(1).tolist())    # 106.0 [4.0, -16.0]

r, gamma, V_s, V_next = 1.0, 0.99, 5.0, 4.5         # TD error로 Advantage 추정
delta = r + gamma * V_next - V_s
print(round(delta, 3))                              # 0.455  > 0 → 이 행동의 확률을 높임
```

## 관련 개념
[[Baseline]] · [[Advantage 추정]] · [[가치 함수·Q 함수]] · [[Actor-Critic]] · [[A2C]] · [[PPO]]
