---
title: scikit-learn
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, sklearn, AI개론]
---
# scikit-learn

## 정의·핵심
- **정의**: 전통 머신러닝 라이브러리(`import sklearn`). 강의에서는 딥러닝 모델 자체보다 **데이터 준비와 평가 지표**에 주로 쓴다.
- **강의에서 많이 쓴 기능** (노트북 사용 횟수 순)
  - `train_test_split`: 학습·테스트 분할. `test_size`, `random_state`(재현성), `stratify=y`(클래스 비율 유지) → [[train·val·test 분할]]
  - `StandardScaler`: 표준화. **훈련 데이터로만 `fit`**, 테스트는 `transform`만 (데이터 누수 방지, 8차시) → [[표준화(StandardScaler)]]
  - `confusion_matrix`, `classification_report`, `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `roc_curve`, `roc_auc_score` → 05의 평가 지표들
  - 데이터셋: `load_iris`(8·9차시), `load_digits`, `load_wine`, `load_breast_cancer`, 가짜 데이터 `make_classification`·`make_regression`
  - 모델: `LogisticRegression` (7차시 머신러닝 맛보기)
  - `label_binarize`: 다중분류 ROC를 그릴 때 라벨을 원-핫으로
- **공통 사용법 (Estimator API)**: `model.fit(X, y)` → `model.predict(X)` / 전처리는 `fit` → `transform` (`fit_transform`은 둘을 한 번에)
- **PyTorch와 연결할 때**: sklearn은 NumPy 배열을 쓴다 → 텐서는 `.cpu().numpy()`로 넘기고, 결과를 다시 `torch.tensor(...).float()`로
- `precision_score(..., average='macro')`: 다중분류에서 클래스별 점수를 평균하는 방식 → [[macro·micro·weighted 평균]]

## 수식·원리
```
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
scaler.fit(X_train)          ← 훈련 데이터 통계만
X_train = scaler.transform(X_train);  X_test = scaler.transform(X_test)
```

## 코드 예시
```python
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

x, y = load_iris(return_X_y=True)
print(x.shape, np.unique(y))                    # (150, 4) [0 1 2]
X_tr, X_te, y_tr, y_te = train_test_split(x, y, test_size=0.3, random_state=42, stratify=y)
print(np.bincount(y_te))                        # [15 15 15] ← 비율 유지

scaler = StandardScaler().fit(X_tr)
X_tr, X_te = scaler.transform(X_tr), scaler.transform(X_te)
print(np.round(X_tr.mean(axis=0), 6))           # [ 0.  0. -0.  0.] 근처

clf = LogisticRegression(max_iter=200).fit(X_tr, y_tr)
print(accuracy_score(y_te, clf.predict(X_te)) > 0.9)   # True
print(classification_report(y_te, clf.predict(X_te)).split()[:4])  # ['precision', 'recall', 'f1-score', 'support']
```

## 관련 개념
[[train·val·test 분할]] · [[stratify]] · [[표준화(StandardScaler)]] · [[혼동행렬]] · [[Classification Report]] · [[로지스틱 회귀]]
