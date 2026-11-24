---
title: 표준화(StandardScaler)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 전처리, AI개론]
---
# 표준화(StandardScaler)

## 정의·핵심
- **정의**: 각 특징(열)에서 **평균을 빼고 표준편차로 나눠** 평균 0, 표준편차 1로 맞추는 전처리. Z-score 정규화. sklearn `StandardScaler`
- **왜 필요한가**
  - 특징마다 **단위·범위가 다르다** (보스턴: 방 개수 4~9, 세율 187~711) → 큰 값의 특징이 기울기를 지배해 손실 지형이 길쭉한 협곡이 되고 경사하강법이 느리고 불안정
  - 표준화하면 모든 특징이 비슷한 크기 → 같은 학습률로 고르게 학습, 수렴이 빨라진다
  - 4차시에서 `X = x - x.mean()`(평균만 빼기)으로 시작한 것과 같은 아이디어 ("경사 하강법은 데이터의 절댓값이 작을 때 더 안정적")
  - 규제(L1·L2)와 거리 기반 모델(KNN, SVM)도 스케일에 민감
- **핵심 규칙 — fit은 훈련 데이터에만** (8차시)
  - `scaler.fit(X_train)` → 훈련 데이터의 평균·표준편차 저장
  - `X_train = scaler.transform(X_train)`, `X_test = scaler.transform(X_test)` — **테스트도 훈련 통계로** 변환
  - 테스트에 `fit_transform`을 하면 데이터 누수 + 훈련과 다른 기준이 됨 → [[데이터 누수(Data Leakage)]]
  - 배포 시에도 같은 scaler를 저장해 두고 새 데이터에 `transform` (`joblib.dump(scaler)`)
- **결과 확인**: `scaler.mean_`, `scaler.scale_`(표준편차), 훈련 데이터 변환 후 평균 ≈ 0, 표준편차 ≈ 1 (테스트는 근사적으로만)
- **다른 스케일러**: `MinMaxScaler`(0~1로), `RobustScaler`(중앙값·IQR, 이상치에 강함)
- 이미지에서는 채널별 평균·표준편차로 `transforms.Normalize` → [[정규화(Normalize)]]
- 정답(y)도 범위가 크면 표준화해서 학습 후 역변환(`inverse_transform`)할 수 있다

## 수식·원리
```
z = (x − μ_train) / σ_train
역변환: x = z · σ_train + μ_train
```

## 코드 예시
```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(0)
X = np.c_[rng.normal(6.3, 0.7, 500), rng.normal(400, 160, 500)]     # 방 개수, 세율 (범위가 매우 다름)
X_tr, X_te = train_test_split(X, test_size=0.2, random_state=0)

scaler = StandardScaler().fit(X_tr)                     # 훈련 데이터로만
X_tr_s, X_te_s = scaler.transform(X_tr), scaler.transform(X_te)
print(np.round(scaler.mean_, 1), np.round(scaler.scale_, 1))   # [  6.3 391.2] [  0.7 153. ]  훈련 데이터의 평균·표준편차
print(np.round(X_tr_s.mean(0), 6), np.round(X_tr_s.std(0), 6))  # [0. 0.] [1. 1.]  (-0.도 0)
print(np.abs(X_te_s.mean(0)).max() < 0.3)               # True  테스트는 근사적으로만 0
print(np.allclose(scaler.inverse_transform(X_te_s), X_te))      # True
```

## 처리 전후 비교

{% include data-demo.html type="feature-scaling" %}

## 관련 개념
[[데이터 누수(Data Leakage)]] · [[정규화(Normalize)]] · [[train·val·test 분할]] · [[경사하강법(GD)]] · [[scikit-learn]]
