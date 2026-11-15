---
title: macro·micro·weighted 평균
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 다중분류, 평가지표, AI개론]
---
# macro·micro·weighted 평균

## 정의·핵심
- **문제**: 정밀도·재현율·F1은 원래 이진분류 지표 → 다중분류에서는 **클래스마다 하나씩**(그 클래스 vs 나머지) 계산한 뒤 **어떻게 하나로 합칠지** 정해야 한다. "세 가지 방식은 각기 다른 목적에 적합" (개론 10차시)
- **macro 평균**
  - 클래스별 지표를 구해 **단순 평균** — 모든 클래스를 **똑같이 중요하게**
  - 소수 클래스의 성능이 나쁘면 크게 떨어진다 → **불균형 데이터에서 소수 클래스까지 잘하는지** 볼 때
- **weighted 평균**
  - 클래스별 지표를 **support(실제 샘플 수)로 가중** 평균
  - 다수 클래스의 영향이 큼 → 전체 데이터 분포를 반영한 성능
  - 불균형이 심하면 소수 클래스 실패를 가려 버릴 수 있다
- **micro 평균**
  - 클래스 구분 없이 **TP·FP·FN을 전부 합친 뒤** 한 번에 계산
  - 다중분류(단일 라벨)에서는 **micro precision = micro recall = micro F1 = 정확도**
  - 샘플 하나하나를 똑같이 중요하게 → 다중 라벨 분류에서 주로 의미가 있다
- **고르는 기준**: 클래스 간 공정성(소수 클래스 중요) → **macro** / 실제 분포 기준 전체 성능 → **weighted** / 샘플 단위 성능 → micro
- sklearn: `f1_score(y, p, average='macro'|'micro'|'weighted')`, `average=None`이면 클래스별 배열

## 수식·원리
```
macro    = (1/K) Σₖ Fₖ
weighted = Σₖ (Nₖ / N) · Fₖ
micro:   P = ΣTP / (ΣTP + ΣFP),  R = ΣTP / (ΣTP + ΣFN)   → 단일 라벨이면 = Accuracy
```

## 코드 예시
```python
import numpy as np
from sklearn.metrics import f1_score, accuracy_score

y_true = [0] * 90 + [1] * 8 + [2] * 2           # 심한 불균형
y_pred = [0] * 90 + [1] * 8 + [0] * 2           # 소수 클래스 2를 전부 틀림
per = f1_score(y_true, y_pred, average=None)
print(np.round(per, 3).tolist())                                        # [0.989, 1.0, 0.0]
print(round(f1_score(y_true, y_pred, average="macro"), 3))              # 0.663  ← 클래스 2 실패가 드러남
print(round(f1_score(y_true, y_pred, average="weighted"), 3))           # 0.97   ← 가려짐
print(f1_score(y_true, y_pred, average="micro"), accuracy_score(y_true, y_pred))   # 0.98 0.98
```

## 관련 개념
[[F1 Score]] · [[Classification Report]] · [[다중분류]] · [[클래스 불균형 문제]] · [[정밀도(Precision)]]
