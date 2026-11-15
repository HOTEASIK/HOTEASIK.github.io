---
title: Early Stopping
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 과적합, AI개론]
---
# Early Stopping

## 정의·핵심
- **정의**: 검증 성능이 **일정 에폭 동안 더 좋아지지 않으면 학습을 멈추고**, 그동안 가장 좋았던 시점의 가중치를 사용하는 방법. 과적합이 시작되기 전에 멈추는 가장 간단한 규제
- **동작**
  1. 매 에폭 검증 손실(또는 정확도) 계산
  2. 지금까지의 최고 기록보다 좋으면 **best 갱신 + 가중치 저장**(`best.pt`), 카운터 0으로
  3. 좋아지지 않으면 카운터 +1
  4. 카운터가 **patience**에 도달하면 학습 종료 → best 가중치를 불러옴
- **patience**: 너무 작으면 일시적인 정체에서 성급하게 멈추고, 너무 크면 과적합 구간까지 학습. 보통 5~20 에폭. `min_delta`보다 작은 개선은 무시
- **장점**: 최적 에폭 수를 따로 찾지 않아도 된다, 학습 시간 절약
- **함께 쓰기**: ReduceLROnPlateau(patience를 더 짧게) → 학습률을 몇 번 줄여도 안 좋아지면 Early Stopping → [[ReduceLROnPlateau]]
- PyTorch에는 내장이 없어 직접 구현하거나 Lightning·Keras 콜백 사용. ultralytics는 `patience=50` 인자
- 기준은 **검증 데이터** — 테스트 데이터로 정하면 데이터 누수 → [[데이터 누수(Data Leakage)]]

## 수식·원리
```
if val_loss < best − min_delta:  best = val_loss; save(model); wait = 0
else:                            wait += 1
if wait ≥ patience: stop → load(best)
```

## 코드 예시
```python
import copy
import torch.nn as nn

class EarlyStopping:
    def __init__(self, patience=3, min_delta=0.0):
        self.patience, self.min_delta = patience, min_delta
        self.best, self.wait, self.best_state = float("inf"), 0, None

    def step(self, val_loss, model):
        if val_loss < self.best - self.min_delta:
            self.best, self.wait = val_loss, 0
            self.best_state = copy.deepcopy(model.state_dict())
        else:
            self.wait += 1
        return self.wait >= self.patience           # True면 멈춤

model = nn.Linear(2, 1); es = EarlyStopping(patience=3)
for epoch, v in enumerate([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5]):
    if es.step(v, model):
        print("stop at epoch", epoch, "best", es.best)   # stop at epoch 5 best 0.6
        break
model.load_state_dict(es.best_state)
```

## 관련 개념
[[과적합(Overfitting)]] · [[학습 곡선]] · [[ReduceLROnPlateau]] · [[state_dict 저장·불러오기]] · [[train·val·test 분할]]
