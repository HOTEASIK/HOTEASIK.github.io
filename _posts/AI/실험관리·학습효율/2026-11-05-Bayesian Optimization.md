---
title: Bayesian Optimization
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [하이퍼파라미터, 베이지안최적화, TPE, 보충]
---
# Bayesian Optimization

## 정의·핵심
- **무엇이 다른가 (보충 02)**: Grid·Random은 과거 결과를 **안 본다**(매 시도 독립, 무정보) / Bayesian은 **이전 결과로 '어디가 유망한지' 예측**해 다음 점을 고름 → 적은 시도로 최고에 빨리 도달 (**실험이 비쌀 때** 특히 유리)
- **2개의 부품 (강의)**
  1. **대리 모델 (Surrogate)**: 지금까지의 (HP → 성능) 관측으로 전체 함수를 추정 (예: **가우시안 프로세스**) — 평균(예측) + **불확실성**(안 가본 곳일수록 넓음)
  2. **획득 함수 (Acquisition)**: 대리 모델을 보고 '다음에 어디를 볼지' 점수화 → 최고 점수 지점을 시도
  - 반복: 시도 → 관측 추가 → 대리 모델 갱신 → 다음 점 선택
  - 비유: **안개 낀 산**에서 최고봉 찾기 — 몇 군데 올라 본 높이로 '지형 지도'를 그리고, '여기가 더 높을 것 같다'는 곳을 다음에 오름
- **탐험 vs 활용 (강의)**: 활용(Exploit) = 좋았던 곳 근처 → 안전하지만 갇힐 수 있음 / 탐험(Explore) = 불확실한 곳 → 더 좋은 봉우리 발견 가능 → [[탐색과 활용]]
  - **EI (Expected Improvement)**: 개선 기대값이 큰 곳 — 가장 널리 씀
  - **UCB (Upper Confidence Bound)**: 평균 + β·불확실성 — β로 탐험 강도 조절
  - **PI (Probability of Improvement)**: 개선될 확률이 큰 곳 (보수적)
- **TPE (Tree-structured Parzen Estimator, 강의)**: **Optuna·Hyperopt의 기본** 알고리즘
  - 관측을 **좋은 그룹 l(x)** 과 **나쁜 그룹 g(x)** 로 나눠 각 분포 추정 → **l/g 비율이 최대**인 HP를 다음에 시도
  - GP: 연속·저차원에 강함, 관측 많으면 느려짐 / **TPE: 이산·범주·조건부 HP**에 강하고 확장성 좋음 → 실무 기본
- **장단점 (강의)**: 장점 — 효율(비싼 실험), 다양한 타입의 HP / 단점 — **순차성**(병렬화가 Grid/Random보다 어려움), 내부 복잡, 초반 관측이 적을 땐 Random과 비슷(웜업 필요)
- **실전 선택 (강의)**: 실험이 싸면 Random, 비싸고 예산이 빠듯하면 Bayesian(Optuna) / "Random으로 시작 → 유망 구간에서 Bayesian으로 정밀화" → [[Optuna 실습]]

## 수식·원리
```
GP 사후:  μ(x), σ(x)   (관측 D = {(x_i, y_i)} 기반)
UCB(x) = μ(x) + β σ(x)
EI(x)  = E[ max(0, f(x) − f_best) ] = (μ − f_best) Φ(z) + σ φ(z),   z = (μ − f_best)/σ
TPE:   x_next = argmax_x  l(x) / g(x)      (l: 상위 γ% 관측의 밀도, g: 나머지)
```

## 코드 예시
```python
import numpy as np
from math import erf, sqrt

def f(x): return np.exp(-(x - 0.72) ** 2 / 0.01) + 0.3 * np.exp(-(x - 0.2) ** 2 / 0.02)   # 블랙박스 (최고 x=0.72)

def gp(X, y, Xs, ls=0.1, noise=1e-6):                    # 가우시안 프로세스 대리 모델
    k = lambda a, b: np.exp(-(a[:, None] - b[None]) ** 2 / (2 * ls ** 2))
    K = k(X, X) + noise * np.eye(len(X)); Ks = k(X, Xs)
    Ki = np.linalg.inv(K)
    mu = Ks.T @ Ki @ y
    var = 1 - np.sum(Ks * (Ki @ Ks), 0)
    return mu, np.sqrt(np.maximum(var, 1e-12))

def ei(mu, sd, best):
    z = (mu - best) / sd
    Phi = 0.5 * (1 + np.vectorize(erf)(z / sqrt(2))); phi = np.exp(-z ** 2 / 2) / sqrt(2 * np.pi)
    return (mu - best) * Phi + sd * phi

rng = np.random.default_rng(0)
Xs = np.linspace(0, 1, 501)
X = rng.uniform(0, 1, 3); y = f(X)                       # 초기 무작위 3번 (웜업)
for it in range(7):                                       # 이후 7번: 대리 모델 + 획득 함수로 다음 점 선택
    mu, sd = gp(X, y, Xs)
    x_next = Xs[np.argmax(ei(mu, sd, y.max()))]
    X, y = np.append(X, x_next), np.append(y, f(x_next))
print(round(float(X[np.argmax(y)]), 2), round(float(y.max()), 3))   # 0.72 근처, 최고값 ≈ 1.0

rng = np.random.default_rng(0)
rand_best = f(rng.uniform(0, 1, 10)).max()                # 같은 10번을 Random으로
print(y.max() >= rand_best)                               # True  과거 결과를 쓰는 쪽이 더 빨리 최고에 접근
```

## 관련 개념
[[Optuna 실습]] · [[Random Search]] · [[Hyperband·BOHB]] · [[탐색과 활용]] · [[하이퍼파라미터 개념]]
