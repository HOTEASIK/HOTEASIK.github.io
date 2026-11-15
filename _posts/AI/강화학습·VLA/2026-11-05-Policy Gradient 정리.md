---
title: Policy Gradient 정리
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 정책기반, 수식, AI응용]
---
# Policy Gradient 정리

## 정의·핵심
- **정의 (응용 15차시)**: 기대 누적 보상 **J(θ)를 정책 파라미터 θ에 대해 미분**하는 방법을 알려 주는 정리 — 환경의 전이 확률 P를 몰라도 **샘플만으로 기울기 추정** 가능
  - `∇_θ J(θ) = E_π[ ∇_θ log π_θ(a_t|s_t) · G_t ]`
  - **G_t**: 시점 t부터의 누적 할인 보상 합 → [[Return·할인율(gamma)]]
- **직관 (강의)**
  - **G_t > 0 (좋은 결과)**: 그 행동의 확률을 **높이는** 방향으로 θ 업데이트
  - **G_t < 0 (나쁜 결과)**: 그 행동의 확률을 **낮추는** 방향
  - `∇ log π`: "이 행동의 확률을 올리려면 θ를 어느 쪽으로 움직여야 하나" / `G_t`: "얼마나 세게 움직일까(가중치)"
- **Log-derivative trick**: `∇π = π · ∇log π` → 기댓값 안으로 미분을 넣어 **샘플 평균**으로 계산 가능
- **경사 상승 (Gradient Ascent)**: `θ ← θ + α ∇_θ J` / PyTorch에선 **loss = −Σ log π · G** 를 경사 하강 → [[REINFORCE]]
- **분산 문제**: G_t는 에피소드마다 크게 흔들림 → **Baseline**을 빼도 기댓값은 변하지 않음(편향 없음) → [[Baseline]], [[Advantage Function]]
- **일반형**: G_t 자리에 Q(s,a), A(s,a), TD error δ 등을 넣을 수 있음 → REINFORCE / Actor-Critic / A2C / PPO가 이 틀의 변형

## 수식·원리
```
J(θ) = E_{τ~π_θ}[ Σ_t γ^t r_{t+1} ]
∇_θ J(θ) = E_{τ~π_θ}[ Σ_t ∇_θ log π_θ(a_t|s_t) · Ψ_t ]
Ψ_t ∈ { G_t,  G_t − b(s_t),  Q(s_t,a_t),  A(s_t,a_t),  δ_t }
log-derivative:  ∇_θ π_θ = π_θ ∇_θ log π_θ
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
R = torch.tensor([1.0, 0.0, 2.0])                   # 행동별 보상 (행동 2가 최선, 1-step 문제)
theta = torch.zeros(3, requires_grad=True)

def J(th): return (th.softmax(0) * R).sum()         # 정확한 기대 보상

J(theta).backward()
exact = theta.grad.clone()                           # 해석적 기울기

theta.grad = None                                    # 샘플 기반 추정: E[∇log π(a) · R(a)]
dist = torch.distributions.Categorical(logits=theta)
a = dist.sample((200000,))
(dist.log_prob(a) * R[a]).mean().backward()
print(exact.round(decimals=3).tolist(), theta.grad.round(decimals=2).tolist())   # 두 기울기가 거의 같음

th = torch.zeros(3, requires_grad=True)              # 경사 상승으로 정책 개선
opt = torch.optim.SGD([th], lr=0.5)
for _ in range(200):
    d = torch.distributions.Categorical(logits=th)
    a = d.sample((64,))
    loss = -(d.log_prob(a) * R[a]).mean()            # loss = −log π · G
    opt.zero_grad(); loss.backward(); opt.step()
print(th.softmax(0).argmax().item(), th.softmax(0)[2].item() > 0.9)   # 2 True  최선 행동 확률이 커짐
```

## 관련 개념
[[REINFORCE]] · [[Policy Network]] · [[Baseline]] · [[Advantage Function]] · [[Actor-Critic]] · [[Return·할인율(gamma)]]
