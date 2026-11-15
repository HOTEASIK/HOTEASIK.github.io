---
title: Calibration
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 확률보정, AI개론]
---
# Calibration

## 정의·핵심
- **정의**: 확률 보정. 모델의 **예측 확률이 실제 확률과 일치하도록** 조정하는 것. "모델이 0.8이라고 말하면 정말 80%가 맞아야 한다" (개론 10차시)
- **보정이 필요한 이유 (강의)**
  - 모델이 **0.8 확률로 예측한 샘플 100개**를 모으면 → 이상적으로는 80개가 실제 긍정
  - 현실: **60개만 긍정** → **과신(Over-confident)**
  - 기상 예보 비유: "비 올 확률 80%"라면 10번 중 8번은 비가 와야 한다. 6번만 오면 보정이 필요
- **왜 중요한가**: **예측 확률 자체를 의사결정에 쓰는** 분야 — **의료 진단, 자율주행, 금융 리스크 평가**에서 필수. 정확도·AUC가 높아도 확률은 엉터리일 수 있다 (AUC는 순위만 봄)
- **현대 딥러닝은 과신하는 경향**: 큰 모델 + CE를 끝까지 줄이면 로짓이 커져 확률이 0.99에 몰린다
- **측정 방법**
  - **신뢰도 다이어그램(Reliability Diagram)**: 예측 확률을 구간(bin)으로 나눠 각 구간의 **평균 확신도 vs 실제 정확도**를 그림. 대각선이면 완벽, 아래면 과신
  - **ECE (Expected Calibration Error)**: 구간별 |정확도 − 확신도|를 샘플 비율로 가중 평균
  - sklearn: `calibration_curve(y, prob, n_bins=10)`
- **보정 방법**
  - **Temperature Scaling**: 로짓을 T로 나눔 — 가장 간단하고 효과적 → [[Temperature Scaling]]
  - Platt Scaling(로짓에 로지스틱 회귀), Isotonic Regression (`CalibratedClassifierCV`)
  - 학습 중: Label Smoothing, Mixup → [[Label Smoothing]]
  - 보정은 **검증 데이터**로 맞춘다

## 수식·원리
```
완벽한 보정:  P(Y = ŷ | 확신도 = p) = p
ECE = Σ_b (|B_b| / N) · |acc(B_b) − conf(B_b)|
```

## 코드 예시
```python
import numpy as np

rng = np.random.default_rng(0)
conf = rng.uniform(0.5, 1.0, 5000)                              # 모델이 말한 확신도
correct = rng.uniform(0, 1, 5000) < (conf - 0.2).clip(0)        # 실제로는 20%p 낮게 맞음 (과신)

def ece(conf, correct, n_bins=10):
    bins = np.linspace(0, 1, n_bins + 1); e = 0.0
    for lo, hi in zip(bins[:-1], bins[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            e += m.mean() * abs(correct[m].mean() - conf[m].mean())
    return e

m8 = (conf > 0.75) & (conf <= 0.85)
print(round(conf[m8].mean(), 2), round(correct[m8].mean(), 2))   # 0.8 0.58  ← 0.8이라 했는데 58%만 맞음
print(round(ece(conf, correct), 2))                              # 0.21
```

## 관련 개념
[[Temperature Scaling]] · [[Label Smoothing]] · [[Softmax]] · [[AUC]] · [[로짓(Logit)]]
