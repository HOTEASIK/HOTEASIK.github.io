---
title: Return·할인율(gamma)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 보상, AI응용]
---
# Return·할인율(gamma)

## 정의·핵심
- **Return (리턴, 누적 할인 보상) G_t**: 시점 t부터 에피소드 끝까지 받을 보상을 **할인율 γ로 할인해 더한 합** — 강화학습이 최대화하려는 대상 (응용 15차시 Policy Gradient: "G_t: 시점 t부터의 누적 할인 보상 합")
  - 강의 REINFORCE 2단계: `G_t = r_{t+1} + γ r_{t+2} + γ² r_{t+3} + …`
  - **즉각 보상 r**만이 아니라 **장기적 결과**를 봄 — 지금 손해라도 나중에 크게 얻는 행동을 학습
- **할인율 γ (Discount Factor, 강의 MDP)**: 미래 보상의 **현재 가치**를 결정하는 **0~1** 값 → 장기적 전략 수립
  - **γ → 0**: 근시안적 — 당장의 보상만 중시
  - **γ → 1**: 원시안적 — 먼 미래 보상도 거의 그대로 반영 (강의 Q-learning 기본값 `discount_factor=0.99`)
  - **실효 지평선(effective horizon)** ≈ 1/(1 − γ): γ = 0.99 → 약 100스텝 앞까지 의미 있게 고려
- **왜 할인하나**
  - **무한 에피소드에서 합이 발산하지 않게** (보상 상한 R_max면 G ≤ R_max/(1 − γ))
  - 미래의 불확실성 반영 ("지금의 1점 > 나중의 1점")
  - 빨리 목표에 도달하는 경로를 선호하게 함 (FrozenLake: 같은 +1이라도 짧은 경로의 할인 리턴이 큼)
- **재귀식**: `G_t = r_{t+1} + γ G_{t+1}` → 뒤에서부터 한 번에 계산 (REINFORCE 구현의 핵심), Bellman 방정식의 출발점 → [[Bellman 방정식]]
- **n-step Return (A2C)**: `G_t^(n) = r_t + γ r_{t+1} + … + γ^n V(s_{t+n})` — n스텝까지는 실제 보상, 이후는 가치 추정으로 대체 → [[A2C]], [[Advantage 추정]]

## 수식·원리
```
G_t = Σ_{k=0}^{T−t−1} γ^k r_{t+k+1}
G_t = r_{t+1} + γ G_{t+1},   G_T = 0
|G_t| ≤ R_max / (1 − γ)
실효 지평선 ≈ 1 / (1 − γ)
```

## 코드 예시
```python
import numpy as np

def discounted_returns(rewards, gamma):
    G, out = 0.0, []
    for r in reversed(rewards):                    # 뒤에서부터: G_t = r_{t+1} + γ G_{t+1}
        G = r + gamma * G
        out.append(G)
    return out[::-1]

rewards = [0, 0, 0, 1]                             # 마지막에 목표 도달
print([round(g, 3) for g in discounted_returns(rewards, 0.9)])   # [0.729, 0.81, 0.9, 1.0]
print([round(g, 3) for g in discounted_returns(rewards, 0.0)])   # [0.0, 0.0, 0.0, 1.0]  근시안

short, long_ = [0] * 5 + [1], [0] * 13 + [1]       # 같은 +1, 경로 길이만 다름
print(round(discounted_returns(short, 0.99)[0], 3), round(discounted_returns(long_, 0.99)[0], 3))   # 0.951 0.878  짧은 경로 선호

for g in (0.9, 0.99):                              # 실효 지평선
    print(g, round(1 / (1 - g)), round(sum(g ** k for k in range(10000)), 1))   # 0.9 10 10.0 / 0.99 100 100.0
```

## 관련 개념
[[MDP]] · [[가치 함수·Q 함수]] · [[Bellman 방정식]] · [[REINFORCE]] · [[Advantage 추정]]
