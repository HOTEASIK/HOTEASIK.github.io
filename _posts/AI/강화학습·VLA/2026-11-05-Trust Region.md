---
title: Trust Region
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, TRPO, KL, AI응용]
---
# Trust Region

## 정의·핵심
- **문제 — 정책 붕괴 (Policy Collapse, 응용 15차시)**: Policy Gradient는 업데이트 크기를 제한하지 않아 **한 번의 큰 업데이트로 정책이 망가질 수 있음**
  - 강의 예: 에피소드 1000에서 보상 **450** → 큰 업데이트 → 에피소드 1002에서 보상 **50** 으로 추락
  - 강화학습은 **자기 정책으로 데이터를 모으므로**, 나빠진 정책은 나쁜 데이터를 모으고 → 회복이 어려움 (지도학습과 다른 점)
- **Trust Region 아이디어 (강의)**: 새 정책이 이전 정책에서 **너무 멀어지지 않는 "신뢰 영역" 안에서만** 개선
  - 거리 척도: **KL Divergence** `KL(π_old ‖ π_new) ≤ δ` (δ ≈ **0.01**) → [[KL Divergence]]
  - 파라미터 공간 거리(‖Δθ‖)가 아니라 **정책 분포의 거리**로 제한 — 파라미터가 조금 바뀌어도 분포는 크게 바뀔 수 있기 때문
- **TRPO (Trust Region Policy Optimization, Schulman 2015)**
  - 목표: **surrogate objective** `E[ (π_new/π_old) · A ]` 를 최대화, 제약 `KL ≤ δ`
  - 풀이: 2차 근사 + **Conjugate Gradient** + Line search → **이론적으로 단조 개선 보장**에 가까움
  - 단점: **구현 복잡, 계산 비용 큼** (Fisher 정보 행렬), 큰 모델·공유 네트워크에 적용 어려움
- **PPO로 단순화**: KL 제약 대신 **ratio를 [1−ε, 1+ε]로 Clipping** — 1차 최적화(Adam)만으로 비슷한 효과 → [[PPO]]

## 수식·원리
```
max_θ  E_t[ (π_θ(a_t|s_t) / π_θ_old(a_t|s_t)) · Â_t ]
s.t.   E_t[ KL(π_θ_old(·|s_t) ‖ π_θ(·|s_t)) ] ≤ δ,    δ ≈ 0.01
KL(p ‖ q) = Σ_a p(a) log (p(a) / q(a))
```

## 코드 예시
```python
import torch

def kl(p, q): return (p * (p / q).log()).sum().item()

old = torch.tensor([0.5, 0.5])
for logit_step in (0.1, 0.5, 2.0):                         # 업데이트 크기별 정책 변화
    new = torch.tensor([logit_step, 0.0]).softmax(0)
    print(logit_step, new.round(decimals=3).tolist(), round(kl(old, new), 4), kl(old, new) <= 0.01)
# 작은 업데이트만 신뢰 영역(KL ≤ 0.01) 안

A = torch.tensor([1.0, -1.0])                                # 행동 0이 좋음 (Advantage)
def best_in_region(delta):                                   # 신뢰 영역 안에서 surrogate 최대화 (1차원 탐색)
    best = (0.0, -1e9)
    for x in torch.linspace(0, 5, 501):
        new = torch.stack([x, torch.tensor(0.0)]).softmax(0)
        if kl(old, new) <= delta:
            surr = (old * (new / old) * A).sum().item()
            best = max(best, (round(x.item(), 2), surr), key=lambda t: t[1])
    return best
print(best_in_region(0.01), best_in_region(0.1))           # δ가 클수록 더 큰 한 걸음 허용
```

## 관련 개념
[[PPO]] · [[KL Divergence]] · [[A2C]] · [[Advantage Function]] · [[Policy Gradient 정리]]
