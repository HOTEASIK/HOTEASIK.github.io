---
title: Policy Network
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, 정책기반, AI응용]
---
# Policy Network

## 정의·핵심
- **정의 (응용 15차시)**: 상태 s를 입력받아 **행동의 확률 분포 π_θ(a|s)** 를 출력하는 신경망. 파라미터 θ를 직접 학습해 정책을 최적화 (Policy-based의 핵심 구성 요소) → [[Value-based vs Policy-based]]
- **이산 행동 (Discrete)**: 출력층 = 행동 수만큼의 logits → **Softmax** → 각 행동의 확률 → **Categorical 분포**에서 샘플링
  - CartPole: 4차원 상태 → 은닉층 → 2개 확률 (왼쪽/오른쪽)
- **연속 행동 (Continuous)**: 출력 = **평균 μ와 표준편차 σ** → **가우시안 분포 N(μ, σ²)** 에서 샘플링
  - 로봇 관절 토크, 자동차 조향각 등 실수값 행동 — σ는 보통 `log_std`를 학습해 양수 보장
- **학습에 필요한 것**: 샘플한 행동의 **log π_θ(a|s)** — Policy Gradient의 핵심 항 → [[Policy Gradient 정리]]
- **탐색**: 확률 분포에서 샘플링하므로 별도의 ε-greedy 없이 자연스럽게 탐색 / 평가(테스트) 땐 argmax나 μ를 사용 → [[탐색과 활용]]
- **Actor-Critic에서의 역할**: Actor = Policy Network, Critic = 가치 네트워크 (몸통을 공유하고 헤드만 나누기도 함) → [[Actor-Critic]]

## 수식·원리
```
이산:  π_θ(a|s) = softmax(f_θ(s))_a,           a ~ Categorical(π_θ(·|s))
연속:  π_θ(a|s) = N(a; μ_θ(s), σ_θ(s)²),       a = μ + σ·ε,  ε ~ N(0, 1)
log N(a; μ, σ²) = −(a − μ)² / (2σ²) − log σ − ½ log 2π
```

## 코드 예시
```python
import math
import torch
import torch.nn as nn
from torch.distributions import Categorical, Normal

torch.manual_seed(0)

class DiscretePolicy(nn.Module):                         # CartPole: 4 → 128 → 2
    def __init__(self, s_dim=4, n_act=2):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(s_dim, 128), nn.ReLU(), nn.Linear(128, n_act))
    def forward(self, s): return Categorical(logits=self.net(s))

class GaussianPolicy(nn.Module):                         # 연속 행동: μ, σ 출력
    def __init__(self, s_dim=3, a_dim=2):
        super().__init__()
        self.mu = nn.Sequential(nn.Linear(s_dim, 64), nn.Tanh(), nn.Linear(64, a_dim))
        self.log_std = nn.Parameter(torch.zeros(a_dim))  # σ = exp(log_std) > 0
    def forward(self, s): return Normal(self.mu(s), self.log_std.exp())

s = torch.randn(4)
dist = DiscretePolicy()(s)
a = dist.sample()
print(round(dist.probs.sum().item(), 4), a.item() in (0, 1), dist.log_prob(a).item() < 0)   # 1.0 True True

g = GaussianPolicy()(torch.randn(3))
a = g.sample()
print(tuple(a.shape), tuple(g.log_prob(a).shape))       # (2,) (2,)  관절별 log π

lp = Normal(0.0, 1.0).log_prob(torch.tensor(0.0)).item()
print(round(lp, 4), round(-0.5 * math.log(2 * math.pi), 4))   # -0.9189 -0.9189  가우시안 log 확률 공식 확인
```

## 관련 개념
[[Policy Gradient 정리]] · [[REINFORCE]] · [[Actor-Critic]] · [[Value-based vs Policy-based]] · [[PPO]] · [[Softmax]]
