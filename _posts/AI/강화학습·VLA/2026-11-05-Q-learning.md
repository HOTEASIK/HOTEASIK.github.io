---
title: Q-learning
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [강화학습, Q-learning, 가치기반, AI응용]
---
# Q-learning

## 정의·핵심
- **정의 (응용 15차시)**: 각 **상태-행동 쌍의 가치(Q-value)를 테이블에 저장**하고 반복적으로 업데이트해 최적 정책을 학습하는 **off-policy** 알고리즘. 모델(P, R) 없이 학습하는 **Model-free** 방법
- **알고리즘 4단계 (강의)**
  1. **Q-table 초기화**: 모든 상태-행동 쌍의 Q-value를 0 또는 작은 무작위 값으로 (`np.zeros((n_states, n_actions))`)
  2. **행동 선택**: **ε-greedy** 정책으로 탐색과 활용의 균형 → [[탐색과 활용]]
  3. **Q-value 업데이트**: Bellman 방정식에 따라 Q(s, a)를 점진적으로 개선 → [[Bellman 방정식]]
  4. **수렴**: 충분한 반복 후 Q-table이 최적 가치 함수 Q*에 근사
- **업데이트 규칙 (강의, 15차시 과제 문제 3)**
  - `Q(s,a) ← Q(s,a) + α [ r + γ·max_a' Q(s', a') − Q(s,a) ]`
  - **α (learning rate)**: 새로운 정보를 얼마나 빠르게 반영할지 (강의 0.1)
  - **γ (discount factor)**: 미래 보상의 중요도 (강의 0.99)
  - 대괄호 = **TD 오차** (목표값 − 현재값)
- **Off-policy인 이유**: 행동은 ε-greedy(탐색 포함)로 하지만, 타깃에는 `max_a'`(greedy 정책)를 사용 → 탐색하면서도 **최적 정책의 가치**를 학습 / 대비: **SARSA**(on-policy, 실제로 고른 다음 행동 a'로 업데이트)
- **강의 실습**: FrozenLake-v1 (`is_slippery=False` 결정적 환경, 16 상태 × 4 행동) — 에피소드 반복 후 성공률·Q-table 시각화
- **한계**: 상태가 많거나 **연속(이미지, CartPole의 실수 상태)** 이면 테이블로 표현 불가 → 신경망으로 Q 근사 = **DQN** → [[DQN]]

## 수식·원리
```
TD target = r + γ max_{a'} Q(s', a')        (종료 시 = r)
Q(s,a) ← Q(s,a) + α (TD target − Q(s,a))
SARSA:   Q(s,a) ← Q(s,a) + α (r + γ Q(s', a'_실제) − Q(s,a))
```

## 코드 예시
```python
import numpy as np

MAP = "SFFFFHFHFFFHHFFG"
def step(s, a):
    r, c = divmod(s, 4)
    r, c = [(r, max(c - 1, 0)), (min(r + 1, 3), c), (r, min(c + 1, 3)), (max(r - 1, 0), c)][a]
    s2 = r * 4 + c
    return s2, float(MAP[s2] == "G"), MAP[s2] in "HG"

class QLearningAgent:                                     # 강의 클래스 구조
    def __init__(self, n_states, n_actions, lr=0.1, gamma=0.99, eps=1.0, decay=0.995, eps_min=0.01):
        self.q_table = np.zeros((n_states, n_actions))
        self.lr, self.gamma, self.eps, self.decay, self.eps_min = lr, gamma, eps, decay, eps_min
    def get_action(self, s, rng):
        if rng.random() < self.eps: return int(rng.integers(self.q_table.shape[1]))
        q = self.q_table[s]; return int(rng.choice(np.flatnonzero(q == q.max())))   # 동점이면 무작위
    def update(self, s, a, r, s2, done):                  # 과제 문제 3
        current_q = self.q_table[s, a]
        max_next_q = 0.0 if done else self.q_table[s2].max()
        self.q_table[s, a] = current_q + self.lr * (r + self.gamma * max_next_q - current_q)

rng = np.random.default_rng(42)
agent, wins = QLearningAgent(16, 4), []
for ep in range(2000):
    s = 0
    for _ in range(100):
        a = agent.get_action(s, rng); s2, r, done = step(s, a)
        agent.update(s, a, r, s2, done); s = s2
        if done: break
    wins.append(r); agent.eps = max(agent.eps_min, agent.eps * agent.decay)
print(round(np.mean(wins[:100]), 2), round(np.mean(wins[-100:]), 2))   # 초반 vs 후반 성공률

s, path = 0, [0]
while MAP[s] not in "HG" and len(path) < 20:
    s, _, _ = step(s, int(agent.q_table[s].argmax())); path.append(s)
print(path[-1], len(path) - 1)                            # 15 6  학습된 greedy 정책이 최단 경로로 목표 도달
```

## 관련 개념
[[DQN]] · [[Bellman 방정식]] · [[탐색과 활용]] · [[가치 함수·Q 함수]] · [[Value-based vs Policy-based]] · [[OpenAI Gym]]
