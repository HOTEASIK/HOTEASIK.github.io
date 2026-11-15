---
title: REINFORCE
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 정책기반, REINFORCE, AI응용]
---
# REINFORCE

## 정의·핵심
- **정의 (응용 15차시)**: Williams(1992)의 가장 기본적인 **Monte Carlo Policy Gradient** 알고리즘. 에피소드를 **끝까지** 진행한 뒤 실제 리턴 G_t로 정책을 업데이트 → [[Policy Gradient 정리]]
- **알고리즘 (강의)**
  1. 현재 정책 π_θ로 **에피소드 하나를 끝까지** 수행 → (s, a, r) 궤적, `log π(a|s)` 저장
  2. 각 시점의 리턴 `G_t = r_{t+1} + γ r_{t+2} + …` 를 **뒤에서부터** 계산 → [[Return·할인율(gamma)]]
  3. `loss = −Σ_t log π_θ(a_t|s_t) · G_t` (강의 코드 `loss = -sum(log_probs * returns)`)
  4. 경사 하강 → 다음 에피소드
  - 실무 팁: 리턴을 **정규화** `(G − mean) / std` 해서 학습 안정화
- **장점**: 구현이 단순, **편향 없는(unbiased)** 기울기 추정, 확률적 정책·연속 행동 가능
- **단점 (강의)**
  - **높은 분산 (High Variance)**: 같은 정책이라도 에피소드마다 리턴이 크게 다름 (강의 예: 200 / 50 / 150) → 학습이 불안정, 느림
  - **샘플 비효율**: on-policy — 한 번 쓴 에피소드는 버림
  - **Credit Assignment 문제**: 에피소드 전체 리턴으로 모든 행동을 똑같이 평가 → 어떤 행동이 좋았는지 구분하기 어려움
  - 에피소드가 끝나야 업데이트 가능
- **개선 방향**: Baseline → Actor-Critic(TD) → A2C → PPO → [[Baseline]], [[Actor-Critic]]

## 수식·원리
```
θ ← θ + α Σ_t γ^t ∇_θ log π_θ(a_t|s_t) G_t     (보통 γ^t 생략)
loss(θ) = − Σ_t log π_θ(a_t|s_t) · G_t
G_t = Σ_{k≥0} γ^k r_{t+k+1}       (Monte Carlo: 실제 끝까지의 합)
```

## 코드 예시
```python
import numpy as np
import torch
import torch.nn as nn

class Corridor:                                       # 0..5 복도, 5 도착 시 +1, 20스텝 제한
    def reset(self): self.s, self.t = 0, 0; return self.s
    def step(self, a):
        self.s = max(self.s - 1, 0) if a == 0 else self.s + 1; self.t += 1
        done = self.s == 5 or self.t >= 20
        return self.s, float(self.s == 5), done

def onehot(s): x = torch.zeros(6); x[s] = 1; return x

torch.manual_seed(0)
policy = nn.Sequential(nn.Linear(6, 32), nn.ReLU(), nn.Linear(32, 2))
opt = torch.optim.Adam(policy.parameters(), lr=0.01)
env, gamma, lengths = Corridor(), 0.99, []
for ep in range(300):
    s, done, log_probs, rewards = env.reset(), False, [], []
    while not done:                                   # 1. 에피소드 끝까지
        dist = torch.distributions.Categorical(logits=policy(onehot(s)))
        a = dist.sample(); log_probs.append(dist.log_prob(a))
        s, r, done = env.step(a.item()); rewards.append(r)
    G, returns = 0.0, []
    for r in reversed(rewards): G = r + gamma * G; returns.insert(0, G)   # 2. 리턴
    returns = torch.tensor(returns)
    loss = -(torch.stack(log_probs) * returns).sum()  # 3. loss = -sum(log_probs * returns)
    opt.zero_grad(); loss.backward(); opt.step()
    lengths.append(env.t)
print(np.mean(lengths[:20]) > np.mean(lengths[-20:]), round(float(np.mean(lengths[-20:])), 1))   # True, 최단 5에 가까움
```

## 관련 개념
[[Policy Gradient 정리]] · [[Baseline]] · [[Advantage Function]] · [[Actor-Critic]] · [[Policy Network]] · [[Return·할인율(gamma)]]
