---
title: Precision–Recall 트레이드오프
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 분류, 평가지표, AI개론]
---
# Precision–Recall 트레이드오프

## 정의·핵심
- **정의**: 임계값을 바꾸면 **정밀도와 재현율이 반대로 움직이는** 관계. 하나를 올리면 다른 하나가 내려간다 (개론 10차시 "정밀도와 재현율의 Trade-off")
- **왜 생기나**
  - **임계값을 낮추면**: 양성 예측이 늘어남 → 진짜 양성을 더 많이 찾음(**TP↑, FN↓ → 재현율↑**) + 가짜 양성도 늘어남(**FP↑ → 정밀도↓**)
  - **임계값을 높이면**: 확실한 것만 양성 → **정밀도↑, 재현율↓**
  - 극단: 임계값 0 → 모두 양성(재현율 1), 임계값 1 → 거의 없음(정밀도 높음, 재현율 0 근처)
- **어디에 맞출까 (비즈니스 판단)**
  - **재현율 우선**: 암 진단, 사기 탐지, 보행자 검출 — 놓치면 큰일 (FN 비용 ↑)
  - **정밀도 우선**: 스팸 필터, 추천, 법적 판단 — 잘못 걸면 큰일 (FP 비용 ↑)
  - 둘 다 중요: **F1**이 최대인 임계값 → [[F1 Score]]
- **PR 곡선 (Precision-Recall Curve)**: 모든 임계값에서의 (재현율, 정밀도)를 이은 곡선. `precision_recall_curve(y_true, y_score)`
  - 곡선이 **오른쪽 위**에 가까울수록 좋은 모델
  - 곡선 아래 면적 = **AP(Average Precision)** → 객체 검출 mAP의 기반 → [[AP·mAP]], [[Precision-Recall 곡선(검출)]]
  - **불균형 데이터에서는 ROC보다 PR 곡선이 더 정직**하다 (TN이 많으면 ROC의 FPR이 작게 나와 좋아 보임)
- 임계값은 **검증 데이터**로 정한다

## 수식·원리
```
임계값 t ↓  →  예측 양성 ↑  →  TP↑, FP↑, FN↓  →  Recall ↑, Precision ↓
AP = Σₙ (Rₙ − Rₙ₋₁) · Pₙ
```

## 코드 예시
```python
import numpy as np
from sklearn.metrics import precision_recall_curve, average_precision_score

y = np.array([0, 0, 1, 0, 1, 1, 0, 1, 1, 0])
score = np.array([0.1, 0.3, 0.35, 0.4, 0.55, 0.6, 0.65, 0.7, 0.8, 0.2])
prec, rec, th = precision_recall_curve(y, score)
for t in (0.3, 0.5, 0.7):
    i = np.searchsorted(th, t)
    print(t, round(prec[i], 2), round(rec[i], 2))     # 임계값이 오를수록 정밀도↑ 재현율↓
# 0.3 0.62 1.0
# 0.5 0.8 0.8
# 0.7 1.0 0.4
f1 = 2 * prec * rec / (prec + rec + 1e-12)
print(th[f1[:-1].argmax()], round(average_precision_score(y, score), 3))   # F1 최대 임계값, AP
```

## 관련 개념
[[정밀도(Precision)]] · [[재현율(Recall)]] · [[F1 Score]] · [[이진분류 출력과 임계값]] · [[ROC 곡선]] · [[AP·mAP]]
