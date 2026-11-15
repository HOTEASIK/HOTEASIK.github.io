---
title: Value-based vs Policy-based
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 비교, AI응용]
---
# Value-based vs Policy-based

## 정의·핵심
- **비교 (응용 15차시 "강화학습의 두 가지 핵심 접근법")**

| 항목 | Value-based | Policy-based |
|---|---|---|
| 대표 알고리즘 | Q-Learning, DQN | Policy Gradient, REINFORCE, PPO |
| 학습 대상 | **Q-value** 학습 후 **간접적으로** 정책 도출 | 파라미터화된 **정책을 직접** 학습 |
| 의사결정 | Q(s,a) → argmax → **결정적(Deterministic)** | π(a\|s) → 확률 분포 → **확률적(Stochastic)** |
| 행동 공간 | 주로 **이산** 행동에 적합 | **연속** 행동 처리에 유리 |

- **Value-based 특징**
  - 장점: off-policy로 **경험 재사용**(Replay Buffer) → 샘플 효율 높음
  - 단점: 연속 행동이면 `argmax_a`를 매번 최적화해야 함, Q값이 조금만 바뀌어도 정책이 급변, 탐색을 ε-greedy로 따로 넣어야 함
- **Policy-based 특징 (강의 REINFORCE 장점)**
  - 확률적 정책 → **자연스러운 탐색**, 가위바위보처럼 **확률적 정책이 최적**인 문제도 해결
  - **연속 행동**(로봇 관절 각도·토크, 조향각)을 가우시안 정책으로 자연스럽게 → [[Policy Network]]
  - 단점: **높은 분산**, on-policy라 샘플 비효율 → Baseline·Critic으로 보완 → [[Baseline]]
- **둘의 결합 — Actor-Critic**: Actor(정책) + Critic(가치) → A2C, PPO → [[Actor-Critic]]
- **강의 성능 계층도**: REINFORCE → REINFORCE + Baseline → Actor-Critic → A2C → PPO (현재 표준) → [[PPO]]

## 수식·원리
```
Value-based:   Q_θ(s, a) 학습 →  π(s) = argmax_a Q_θ(s, a)
Policy-based:  π_θ(a | s) 직접 학습,  ∇_θ J = E[∇_θ log π_θ(a|s) · G]
연속 행동:     a ~ N(μ_θ(s), σ_θ(s)²)    (argmax 불필요)
```

## 코드 예시
```python
import numpy as np
import torch

Q = torch.tensor([1.0, 1.2, 0.9])                       # Value-based: Q값의 argmax → 결정적
print(Q.argmax().item(), (Q + torch.tensor([0, -0.21, 0])).argmax().item())   # 1 0  Q가 조금만 바뀌어도 행동이 급변

logits = torch.tensor([1.0, 1.2, 0.9])                  # Policy-based: 확률 분포에서 샘플 → 확률적
probs = logits.softmax(0)
torch.manual_seed(0)
samples = torch.multinomial(probs, 1000, replacement=True)
print(probs.round(decimals=2).tolist(), torch.bincount(samples).tolist())   # 모든 행동을 확률적으로 시도 (자연스러운 탐색)

mu, sigma = torch.tensor([0.3, -0.5]), torch.tensor([0.1, 0.2])   # 연속 행동 (로봇 관절 2개 토크)
a = torch.distributions.Normal(mu, sigma).sample()
print(tuple(a.shape))                                   # (2,)  argmax 없이 바로 실수 행동

rng = np.random.default_rng(0)                          # 가위바위보: 결정적 정책은 상대에게 읽힘
def payoff(p_me, counter):                              # 상대가 내 최빈 수를 이기는 수를 냄
    me = rng.choice(3, 3000, p=p_me); opp = (np.bincount(me, minlength=3).argmax() + 1) % 3
    return round(float(np.mean(np.where(me == opp, 0, np.where((me - opp) % 3 == 1, 1, -1)))), 2)
print(payoff([1, 0, 0], True), abs(payoff([1/3] * 3, True)) < 0.1)   # -1.0 True  확률적 정책이 최적
```

## 관련 개념
[[Q-learning]] · [[DQN]] · [[Policy Network]] · [[Policy Gradient 정리]] · [[Actor-Critic]] · [[PPO]]
