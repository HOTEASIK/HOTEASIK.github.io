---
title: Random Search
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [하이퍼파라미터, RandomSearch, 보충]
---
# Random Search

## 정의·핵심
- **정의 (보충 02)**: 각 하이퍼파라미터를 정해진 **범위/분포에서 무작위로** 뽑아 **N번** 시도하고, 검증 성능 최고를 채택
  - 예: `lr = 10^uniform(−4, −1)`, `batch = choice{32, 64, 128}`, `dropout = uniform(0, 0.5)` 를 12번 샘플
  - **예산 = 몇 번 뽑을지(N)** 만 정하면 됨 — 조합 수와 무관
- **Grid와의 결정적 차이 (강의)**: 고정 후보에 묶이지 않고 **연속 범위** 탐색 / HP가 몇 개든 N번만 (조합 폭발 없음) / 각 HP가 매번 다른 값
- **왜 Grid를 이기나 (강의, Bergstra & Bengio 2012)**
  - Grid 3×3 = 9번 → lr은 **딱 3개 값**만 시험 (나머지는 무관한 HP 반복) → 최적 lr이 그 사이에 있으면 영원히 못 찾음
  - Random 9번 → lr을 **9개 서로 다른 값**으로 → 최적 근처를 맞출 확률 ↑
  - **저유효차원**: 대부분 문제는 실제로 중요한 HP가 **소수** → Grid는 비중요 축에도 시도를 균등 분배(낭비)
  - 한 줄: "중요한 축을 더 많은 값으로 시험할수록 유리한데, Random은 **자동으로** 그렇게 된다"
- **실습 문제 (강의)**: 좋은 구간이 상위 10%일 때 N = 20번이면 한 번도 못 맞출 확률 0.9²⁰ ≈ **12%**, 적어도 한 번 맞출 확률 ≈ **88%**
- **로그 균등 샘플링 (2_1 연습 문제 4)**: `lr = 10 ** random.uniform(-4, -1)` — 그냥 `uniform(1e-4, 1e-1)`이면 대부분 큰 값(0.01~0.1)만 나옴
- **실무 기본값 (강의)**: "**Grid보다 Random을 먼저**" — 후보가 아주 적고 명확할 때만 Grid / 실험이 싸고 빠르면 Random으로 충분히 넓게, 이후 유망 구간에서 Bayesian으로 정밀화 → [[Bayesian Optimization]]

## 수식·원리
```
λ_k ~ p(λ),  k = 1..N,     λ* = argmax_k Score_val(λ_k)
P(적어도 한 번 상위 q 구간) = 1 − (1 − q)^N        q = 0.1, N = 20 → 0.88
로그 균등:  log10(lr) ~ U(−4, −1)
```

## 코드 예시
```python
import math
import random
import numpy as np

print(round(0.9 ** 20, 2), round(1 - 0.9 ** 20, 2))       # 0.12 0.88

random.seed(0)
naive = [random.uniform(1e-4, 1e-1) for _ in range(1000)]
logu = [10 ** random.uniform(-4, -1) for _ in range(1000)]  # 2_1 연습 문제 4
print(round(np.mean(np.array(naive) >= 1e-2), 2), round(np.mean(np.array(logu) >= 1e-2), 2))   # 0.89 0.34  로그 균등이어야 골고루

def score(lr, junk):                                        # lr만 중요하고 junk는 무관 (저유효차원)
    return -(math.log10(lr) + 2.3) ** 2 + 0 * junk

grid_lrs = [1e-4, 1e-3, 1e-1]                               # Grid 3×3: lr은 3개 값뿐
grid_best = max(score(lr, j) for lr in grid_lrs for j in (0, 1, 2))
random.seed(1)
rand_best = max(score(10 ** random.uniform(-4, -1), random.random()) for _ in range(9))   # Random 9번: lr 9개
print(round(grid_best, 3), round(rand_best, 3), rand_best > grid_best)   # 같은 9번인데 Random이 최적(lr≈0.005)에 더 가까움
```

## 관련 개념
[[Grid Search]] · [[Bayesian Optimization]] · [[Hyperband·BOHB]] · [[하이퍼파라미터 개념]]
