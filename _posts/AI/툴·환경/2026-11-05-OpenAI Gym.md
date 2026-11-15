---
title: OpenAI Gym
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, 강화학습, AI응용]
---
# OpenAI Gym

## 정의·핵심
- **정의**: 강화학습 알고리즘을 개발·비교하기 위한 **표준 환경 라이브러리**. 다양한 난이도의 문제를 같은 사용법으로 제공한다. 지금은 후속 프로젝트인 **Gymnasium**(`pip install gymnasium`, `import gymnasium as gym`)을 쓴다. (응용 15차시)
- **같은 사용법(인터페이스)**
  - `env = gym.make("CartPole-v1")`
  - `state, info = env.reset(seed=0)`: 에피소드 시작
  - `next_state, reward, terminated, truncated, info = env.step(action)`
    - `terminated`: 실패·성공으로 끝남 (막대가 쓰러짐), `truncated`: 시간 제한으로 끊김 (500 step)
    - 옛 gym은 `done` 하나만 돌려줬다 → 코드를 볼 때 버전 차이 주의
  - `env.action_space`, `env.observation_space`: 행동·상태의 모양과 범위, `action_space.sample()`: 무작위 행동
- **강의 환경 두 가지**
  - **FrozenLake**: 4×4(또는 8×8) 얼음 격자에서 구멍(H)을 피해 목표(G)로. 상태 16개, 행동 상하좌우 4개, **미끄러짐(확률적 전이)**, 목표 도달 시 +1 → Q-Learning(표)
  - **CartPole**: 카트 위 막대 세우기. 상태 4차원 연속(위치·속도·각도·각속도), 행동 왼쪽/오른쪽, 버틴 step마다 +1, 500 step 목표 → **DQN** 실습
- **DQN 실습 설정 (강의)**: CartPole-v1, 학습률 0.001, 배치 64, 리플레이 버퍼 10,000, 4 → 128 → 128 → 2 네트워크

## 수식·원리
```
state ─agent(policy)─▶ action ─env.step─▶ (next_state, reward, terminated, truncated)
       ▲─────────────────────────────────────────────┘   반복 → 누적 보상 최대화
```

## 코드 예시
```python
import gymnasium as gym

env = gym.make("CartPole-v1")
print(env.observation_space.shape, env.action_space.n)   # (4,) 2
state, info = env.reset(seed=0)
total = 0
while True:
    action = env.action_space.sample()                    # 무작위 정책
    state, reward, terminated, truncated, info = env.step(action)
    total += reward
    if terminated or truncated:
        break
print(total < 100)                                         # True (무작위는 금방 쓰러짐, 보통 10~40)
env.close()
```

## 관련 개념
[[강화학습 개요]] · [[MDP]] · [[Q-Learning]] · [[DQN]] · [[탐색과 활용(ε-greedy)]]
