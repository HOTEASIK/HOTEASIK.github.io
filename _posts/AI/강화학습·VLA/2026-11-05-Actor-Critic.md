---
title: Actor-Critic
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, Actor-Critic, AI응용]
---
# Actor-Critic

## 정의·핵심
- **정의 (응용 15차시)**: **정책(Actor)** 과 **가치 함수(Critic)** 를 함께 학습하는 방법 — Policy-based와 Value-based의 결합 → [[Value-based vs Policy-based]]
  - **Actor π_θ(a|s)**: 행동을 결정 ("배우") → [[Policy Network]]
  - **Critic V_w(s)**: 행동이 얼마나 좋았는지 평가 ("비평가") → Baseline 역할 → [[Baseline]]
- **TD Error (강의)**: `δ = r + γ V(s') − V(s)` — Critic이 **예상보다 얼마나 좋았나**를 알려 줌 (Advantage의 1-step 추정) → [[Advantage 추정]]
  - δ > 0: 예상보다 좋음 → 그 행동 확률 ↑ / δ < 0: 예상보다 나쁨 → 확률 ↓
- **업데이트 (강의 코드)**
  - `critic_loss = td_error ** 2` — V(s)를 TD 타깃 `r + γV(s')`에 맞춤
  - `actor_loss = -log_prob * td_error.detach()` — **detach**: Actor 업데이트가 Critic 쪽으로 기울기를 흘리지 않게
- **REINFORCE 대비 장점 (강의)**
  - **매 스텝 업데이트** 가능 (에피소드 끝까지 기다리지 않음, 온라인 학습)
  - 분산 ↓ (MC 리턴 대신 TD 추정) — 대신 V 오차로 **편향** 약간 ↑
  - Credit assignment 개선: 각 행동을 그 시점 기준으로 평가
- **발전**: A2C(동기·병렬·n-step), A3C(비동기), PPO(Clipping), SAC(연속 행동, 엔트로피 최대화) → [[A2C]], [[PPO]]

## 수식·원리
```
δ_t = r_{t+1} + γ V_w(s_{t+1}) (1 − done) − V_w(s_t)
Critic:  L_V(w) = δ_t²
Actor:   L_π(θ) = − log π_θ(a_t|s_t) · stopgrad(δ_t)
θ ← θ − α_θ ∇L_π,    w ← w − α_w ∇L_V
```

## 코드 예시
```python
import numpy as np
import torch
import torch.nn as nn

def onehot(s): x = torch.zeros(6); x[s] = 1; return x
def env_step(s, a):                                   # 0..5 복도, 5 도착 시 +1
    s2 = max(s - 1, 0) if a == 0 else s + 1
    return s2, float(s2 == 5), s2 == 5

torch.manual_seed(0)
actor = nn.Sequential(nn.Linear(6, 32), nn.ReLU(), nn.Linear(32, 2))
critic = nn.Sequential(nn.Linear(6, 32), nn.ReLU(), nn.Linear(32, 1))
opt = torch.optim.Adam(list(actor.parameters()) + list(critic.parameters()), lr=0.01)
gamma, lengths = 0.99, []
for ep in range(200):
    s, done, t = 0, False, 0
    while not done and t < 30:
        dist = torch.distributions.Categorical(logits=actor(onehot(s)))
        a = dist.sample()
        s2, r, done = env_step(s, a.item())
        v, v2 = critic(onehot(s)).squeeze(), critic(onehot(s2)).squeeze()
        td_error = r + gamma * v2.detach() * (1 - float(done)) - v
        critic_loss = td_error ** 2                               # 강의 코드
        actor_loss = -dist.log_prob(a) * td_error.detach()
        opt.zero_grad(); (actor_loss + critic_loss).backward(); opt.step()   # 매 스텝 업데이트
        s, t = s2, t + 1
    lengths.append(t)
print(round(float(np.mean(lengths[:20])), 1), round(float(np.mean(lengths[-20:])), 1))   # 초반 vs 후반 에피소드 길이
V = [round(critic(onehot(i)).item(), 2) for i in range(5)]
print(V[4] > V[0])                                    # True  목표에 가까운 상태일수록 Critic 가치가 큼
```

## 관련 개념
[[A2C]] · [[PPO]] · [[Advantage Function]] · [[Advantage 추정]] · [[Baseline]] · [[REINFORCE]] · [[Policy Network]]
