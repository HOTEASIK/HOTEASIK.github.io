---
title: Classification Report
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 분류, 평가지표, AI개론]
---
# Classification Report

## 정의·핵심
- **정의**: sklearn의 `classification_report(y_true, y_pred)` — **클래스별 정밀도·재현율·F1·support**와 전체 평균을 한 번에 표로 출력하는 함수. 분류 결과 점검의 표준 도구 (개론 8~10차시)
- **표 읽는 법**
  - **행**: 각 클래스 + `accuracy` + `macro avg` + `weighted avg`
  - **precision / recall / f1-score**: 그 클래스를 양성으로 보고 계산한 값
  - **support**: 그 클래스의 **실제 샘플 수** (혼동행렬 행 합)
  - `accuracy`: 전체 정확도 (support는 전체 수)
  - `macro avg`: 클래스별 값의 단순 평균 / `weighted avg`: support로 가중 평균 → [[macro·micro·weighted 평균]]
- **유용한 인자**
  - `target_names=['정상', '사기']`: 클래스 이름 표시 (ImageFolder의 `classes` 넘기기)
  - `digits=4`: 소수 자릿수
  - `output_dict=True`: 딕셔너리로 받아 원하는 값만 꺼내기 (WandB 기록, DataFrame 변환)
  - `zero_division=0`: 예측이 없는 클래스의 경고 처리
- **점검 포인트**
  - support가 작은 클래스의 recall이 낮은가 → 불균형 문제
  - macro avg가 weighted avg보다 많이 낮다 → **소수 클래스 성능이 나쁘다**
  - 특정 클래스 precision만 낮다 → 다른 클래스가 그 클래스로 많이 잘못 예측됨 → 혼동행렬 확인
- PyTorch 결과는 `torch.cat`으로 모은 뒤 `.cpu().numpy()`로 넘긴다

## 수식·원리
```
              precision    recall  f1-score   support
     class 0     P₀          R₀       F₀         N₀
     ...
    accuracy                          Acc        N
   macro avg   mean(P)     mean(R)   mean(F)     N
weighted avg   Σ(Nₖ/N)Pₖ   ...
```

## 코드 예시
```python
from sklearn.metrics import classification_report

y_true = [0, 0, 0, 0, 0, 0, 1, 1, 2, 2]
y_pred = [0, 0, 0, 0, 0, 1, 1, 0, 2, 2]
print(classification_report(y_true, y_pred, target_names=["개", "고양이", "토끼"], digits=2))
rep = classification_report(y_true, y_pred, output_dict=True)
print(round(rep["1"]["recall"], 2), rep["1"]["support"])                                 # 0.5 2.0
print(round(rep["macro avg"]["f1-score"], 3), round(rep["weighted avg"]["f1-score"], 3))  # 0.778 0.8
```

## 관련 개념
[[혼동행렬]] · [[F1 Score]] · [[macro·micro·weighted 평균]] · [[정밀도(Precision)]] · [[재현율(Recall)]] · [[scikit-learn]]
