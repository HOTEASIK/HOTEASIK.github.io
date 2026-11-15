---
title: 과적합(Overfitting)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 과적합, AI개론]
---
# 과적합(Overfitting)

## 정의·핵심
- **정의**: 모델이 훈련 데이터에 **너무 익숙해져서**(잡음·우연한 패턴까지 외워서) 정작 **새로운 데이터(검증·테스트)에서는 성능이 떨어지는** 현상. 강의 표현으로 "과학습" — 연습 문제는 다 외웠는데 시험에서 못 푸는 학생 (개론 12차시)
- **학습 곡선으로 알아보기**
  1. 초기 단계: 훈련·검증 손실 모두 감소
  2. 검증 손실이 최솟값에 도달
  3. **과학습 발생**: 훈련 손실은 계속 감소하지만 **검증 손실은 증가** (두 곡선이 벌어짐)
  - 12차시 CNN_v2: 40 에폭 근처 검증 손실 반등 → [[학습 곡선]]
- **반대 개념 — 과소적합(Underfitting)**: 모델이 너무 단순하거나 덜 학습되어 **훈련 데이터조차** 잘 못 맞힘 → [[편향–분산 트레이드오프]]
- **원인**: 데이터에 비해 **모델이 너무 큼**(파라미터 많음), **데이터가 적음**, 너무 오래 학습, 잡음 많은 라벨
- **대응 방법**
  - 데이터: **더 모으기**, **데이터 증강** → [[데이터 증강]]
  - 모델: 작게 만들기, **Dropout** → [[Dropout]], **Batch Normalization** → [[Batch Normalization]]
  - 손실·최적화: **L2(weight decay)·L1 규제** → [[L2 규제(Ridge, weight_decay)]], Label Smoothing
  - 학습: **Early Stopping** → [[Early Stopping]]
  - 전이학습: 사전학습 가중치에서 시작하면 적은 데이터로도 덜 과적합 → [[전이학습(Transfer Learning)]]
- **검증 데이터가 필수**: 훈련 성능만 보면 과적합을 알 수 없다 → [[train·val·test 분할]]

## 수식·원리
```
일반화 오차(gap) = 검증 손실 − 훈련 손실   ← 커질수록 과적합
고차 다항식 예: 10개 점에 9차 다항식 → 훈련 오차 0, 새 점에서는 크게 틀림
```

## 코드 예시
```python
import numpy as np

rng = np.random.default_rng(2)
x = np.linspace(0, 1, 10); y = np.sin(2 * np.pi * x) + rng.normal(0, 0.3, 10)
xt = np.linspace(0, 1, 100); yt = np.sin(2 * np.pi * xt)
for deg in (1, 3, 9):
    c = np.polyfit(x, y, deg)
    tr = np.mean((np.polyval(c, x) - y) ** 2); te = np.mean((np.polyval(c, xt) - yt) ** 2)
    print(deg, round(tr, 3), round(te, 3))
# 1 0.22 0.242    과소적합 (둘 다 큼)
# 3 0.086 0.036   적당 (테스트 오차 최소)
# 9 0.0 0.764     과적합 (훈련 0, 테스트 가장 큼)
```

## 관련 개념
[[편향–분산 트레이드오프]] · [[학습 곡선]] · [[Dropout]] · [[데이터 증강]] · [[Early Stopping]] · [[L2 규제(Ridge, weight_decay)]]
