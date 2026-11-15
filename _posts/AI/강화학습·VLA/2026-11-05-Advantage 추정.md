---
title: Advantage 추정
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, Advantage, GAE, AI응용]
---
# Advantage 추정

## 정의·핵심
- **문제**: 진짜 A = Q − V를 알 수 없으므로 **샘플과 Critic V(s)로 추정**해야 함 — 방법에 따라 **편향(bias) – 분산(variance)** 트레이드오프 (응용 15차시)
- **세 가지 방법 비교 (강의)**

| 방법 | 추정식 | 편향 | 분산 | 사용 알고리즘 |
|---|---|---|---|---|
| **Monte Carlo** | G_t − V(s_t) | 없음 (실제 리턴) | **높음** | REINFORCE (+Baseline) |
| **TD (1-step)** | r + γV(s') − V(s) | **있음** (V 추정 오차) | 낮음 | 간단한 Actor-Critic |
| **GAE / n-step** | δ들의 가중합 | 중간 (조절 가능) | 중간 | **PPO, TRPO, A2C** |

- **n-step**: n스텝까지 실제 보상, 그 뒤는 V로 부트스트랩 — n이 크면 MC에 가깝고 작으면 TD에 가까움 → [[A2C]]
- **GAE (Generalized Advantage Estimation, Schulman 2015)**: 모든 n-step을 **λ로 지수 가중 평균**
  - `Â_t = Σ_l (γλ)^l δ_{t+l}`
  - **λ = 0** → 1-step TD (편향↑ 분산↓), **λ = 1** → Monte Carlo (편향↓ 분산↑)
  - 실무 기본값 **γ = 0.99, λ = 0.95** (PPO)
- **뒤에서부터 재귀 계산**: `Â_t = δ_t + γλ(1 − done) Â_{t+1}` — 에피소드 경계에서 끊어 줌
- **Critic 학습 타깃**: `returns = Â + V(s)` → value loss = (returns − V)²

## 수식·원리
```
δ_t = r_{t+1} + γ V(s_{t+1}) − V(s_t)
Â_t^(n) = Σ_{k=0}^{n−1} γ^k r_{t+k+1} + γ^n V(s_{t+n}) − V(s_t)
Â_t^GAE(γ,λ) = Σ_{l≥0} (γλ)^l δ_{t+l}
λ = 0 → δ_t,     λ = 1 → G_t − V(s_t)
```

## 코드 예시
```python
import numpy as np

def gae(rewards, values, last_value, dones, gamma=0.99, lam=0.95):
    adv, A = np.zeros(len(rewards)), 0.0
    values = np.append(values, last_value)
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] * (1 - dones[t]) - values[t]
        A = delta + gamma * lam * (1 - dones[t]) * A
        adv[t] = A
    return adv

r = np.array([1.0, 1.0, 1.0, 1.0]); V = np.array([2.0, 1.5, 1.0, 0.5]); d = np.array([0, 0, 0, 1.0])
td = gae(r, V, 0.0, d, lam=0.0)                         # λ = 0 → 1-step TD error
mc = gae(r, V, 0.0, d, lam=1.0)                         # λ = 1 → Monte Carlo G − V
G = np.array([sum(0.99 ** k * r[t + k] for k in range(4 - t)) for t in range(4)])
print(td.round(3).tolist())                             # [0.485, 0.49, 0.495, 0.5]
print(np.allclose(mc, G - V), gae(r, V, 0.0, d).round(3).tolist())   # True, λ=0.95는 그 사이

rng = np.random.default_rng(0)                          # 편향-분산: 보상에 노이즈, V는 약간 틀린 값
true_r = np.ones(50); V_bad = np.full(50, 30.0)
outs = {lam: [gae(true_r + rng.normal(0, 1, 50), V_bad, 0.0, np.r_[np.zeros(49), 1], lam=lam)[0] for _ in range(500)] for lam in (0.0, 0.95, 1.0)}
print([round(float(np.std(v)), 2) for v in outs.values()])   # λ가 클수록 분산 ↑
```

## 관련 개념
[[Advantage Function]] · [[Baseline]] · [[A2C]] · [[PPO]] · [[Actor-Critic]] · [[Return·할인율(gamma)]]
