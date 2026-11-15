---
title: 정밀도(Precision)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 분류, 평가지표, AI개론]
---
# 정밀도(Precision)

## 정의·핵심
- **정의**: 모델이 **긍정이라고 예측한 것 중 실제로 긍정인 비율**. `TP / (TP + FP)` — "모델이 양성이라고 할 때 얼마나 믿을 수 있나"
- **관점**: **예측 기준**(혼동행렬의 열). FP(오경보)가 늘면 떨어진다
- **중요한 상황 — FP의 비용이 클 때**
  - **스팸 필터**: 정상 메일을 스팸함으로 보내면(FP) 중요한 메일을 잃는다
  - 추천 시스템, 유튜브 아동용 콘텐츠 판정, 무고한 사람을 범인으로 지목
  - **객체 검출**: 없는 물체를 검출하는 오탐 → AP 계산의 축 → [[AP·mAP]]
- **쉽게 올리는 법과 함정**: 임계값을 아주 높여서 **아주 확실한 것만** 양성이라고 하면 정밀도는 1에 가까워지지만, 대부분의 양성을 놓친다(재현율↓) → 정밀도만 보면 안 된다 → [[Precision–Recall 트레이드오프]]
- 양성 예측이 하나도 없으면 0/0 → sklearn은 경고와 함께 0 (`zero_division` 인자)
- sklearn: `precision_score(y_true, y_pred)`, 다중분류는 `average='macro'` 등 → [[macro·micro·weighted 평균]]
- 다른 이름: 양성 예측도(PPV)

## 수식·원리
```
Precision = TP / (TP + FP)
```

## 코드 예시
```python
from sklearn.metrics import precision_score

y_true = [1, 0, 1, 1, 0, 0, 1, 0]
y_pred = [1, 0, 0, 1, 0, 1, 1, 0]                          # TP=3, FP=1
print(precision_score(y_true, y_pred))                     # 0.75 = 3 / (3 + 1)

strict = [1, 0, 0, 0, 0, 0, 0, 0]                          # 아주 확실한 1개만 양성
print(precision_score(y_true, strict))                     # 1.0  정밀도는 만점이지만 양성 3개를 놓침
print(precision_score(y_true, [0] * 8, zero_division=0))   # 0.0  양성 예측이 없을 때
```

## 관련 개념
[[재현율(Recall)]] · [[혼동행렬]] · [[F1 Score]] · [[Precision–Recall 트레이드오프]] · [[AP·mAP]]
