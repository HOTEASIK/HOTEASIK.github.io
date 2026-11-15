---
title: train·val·test 분할
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 데이터분할, AI개론]
---
# train·val·test 분할

## 정의·핵심
- **왜 나누나**: 학습에 쓴 데이터로 평가하면 "외운 문제로 시험 본" 것이라 실제 성능(**일반화 성능**)을 알 수 없다
- **세 가지 역할**
  - **Train(훈련)**: 파라미터(가중치)를 학습
  - **Validation(검증)**: **하이퍼파라미터 선택**(학습률, 에폭, 모델 구조), Early Stopping, 최적 체크포인트 선택, 임계값 결정
  - **Test(테스트)**: 모든 결정이 끝난 뒤 **딱 한 번** 최종 성능 보고. 테스트 결과를 보고 다시 튜닝하면 테스트에 과적합된다
  - 흔한 비율: 70/15/15, 80/10/10, 데이터가 많으면 98/1/1
- **`train_test_split`** (sklearn, 강의에서 가장 많이 사용)
  - `X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`
  - `test_size`: 테스트 비율(0.2) 또는 개수
  - **`random_state`**: 무작위 분할의 **시드** — 같은 값이면 매번 같은 분할 → **재현성**. 실험을 비교할 때 고정 필수
  - `shuffle=True`(기본): 섞어서 나눔. **시계열**은 섞으면 미래로 과거를 예측하는 누수 → `shuffle=False`로 시간순 분할
  - `stratify=y`: 클래스 비율 유지 → [[stratify]]
  - 3개로 나누려면 두 번 호출 (먼저 test 떼고, 남은 것에서 val 떼기)
- **PyTorch 방식**: `torch.utils.data.random_split(dataset, [n_train, n_val], generator=torch.Generator().manual_seed(42))`, torchvision 데이터셋은 `train=True/False`로 이미 나뉘어 있음
- **교차 검증 (K-Fold)**: 데이터가 적을 때 K등분해 K번 돌아가며 검증 → 평균 성능 (`cross_val_score`)
- 전처리 통계(평균·표준편차)는 **분할 후 훈련 데이터로만** 계산 → [[데이터 누수(Data Leakage)]]

## 수식·원리
```
전체 ─split(test_size=0.2)─▶ train+val (80%) ─split(0.125)─▶ train (70%) / val (10%)
                          └▶ test (20%)   ← 마지막에 한 번만
```

## 코드 예시
```python
import numpy as np
import torch
from sklearn.model_selection import train_test_split
from torch.utils.data import TensorDataset, random_split

X = np.arange(1000).reshape(500, 2); y = np.arange(500) % 2
X_tmp, X_te, y_tmp, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
X_tr, X_val, y_tr, y_val = train_test_split(X_tmp, y_tmp, test_size=0.125, random_state=42)
print(len(X_tr), len(X_val), len(X_te))                     # 350 50 100

a = train_test_split(X, y, test_size=0.2, random_state=42)[1][:3]
b = train_test_split(X, y, test_size=0.2, random_state=42)[1][:3]
print(np.array_equal(a, b))                                  # True  같은 시드 → 같은 분할

ds = TensorDataset(torch.tensor(X), torch.tensor(y))
tr, va = random_split(ds, [400, 100], generator=torch.Generator().manual_seed(42))
print(len(tr), len(va))                                      # 400 100
```

## 관련 개념
[[stratify]] · [[데이터 누수(Data Leakage)]] · [[Early Stopping]] · [[과적합(Overfitting)]] · [[재현성]] · [[scikit-learn]]
