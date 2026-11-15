---
title: 데이터 누수(Data Leakage)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 데이터분할, AI개론]
---
# 데이터 누수(Data Leakage)

## 정의·핵심
- **정의**: 학습 과정에 **평가용(검증·테스트) 데이터의 정보가 새어 들어가** 성능이 실제보다 좋게 측정되는 문제. 시험 문제를 미리 본 것과 같다 — 배포하면 성능이 크게 떨어진다 (개론 4차시 실습 "데이터 분할 누수 방지", 8차시)
- **흔한 누수 유형**
  1. **전처리 누수**: 분할 **전에** 전체 데이터로 `StandardScaler.fit`, 결측치 평균 채우기, 특징 선택 → 테스트 데이터의 평균·분산이 훈련에 섞임
     - 해결: **분할 먼저** → 훈련 데이터로만 `fit` → 검증·테스트는 `transform`만 → [[표준화(StandardScaler)]]
  2. **중복·근접 샘플 누수**: 같은 환자의 여러 X-ray, 같은 영상의 연속 프레임, 증강으로 만든 사본이 train과 test에 나뉘어 들어감 → **그룹(환자·영상) 단위로 분할** (`GroupShuffleSplit`)
  3. **시간 누수**: 시계열을 섞어서 나눠 **미래 정보로 과거를 예측**
  4. **타깃 누수**: 정답이 정해진 뒤에야 알 수 있는 특징(예: "환불 처리 여부"로 사기 예측)이 입력에 포함
  5. **테스트로 튜닝**: 테스트 성능을 보며 하이퍼파라미터·임계값을 고르면 테스트에 과적합 → 검증 데이터를 따로 둔다
- **누수 의심 신호**: 성능이 비현실적으로 높다(99.9%), 특정 특징 하나의 중요도가 압도적, 배포 후 성능 급락
- **sklearn `Pipeline`**: 전처리와 모델을 묶으면 교차 검증 때도 각 폴드의 훈련 부분으로만 fit되어 누수를 막아 준다

## 수식·원리
```
❌ scaler.fit(X_all) → split → train/test        (테스트 통계 유출)
✅ split → scaler.fit(X_train) → transform(X_train), transform(X_test)
```

## 코드 예시
```python
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

rng = np.random.default_rng(0)
X = rng.normal(size=(100, 2000)); y = rng.integers(0, 2, 100)     # 완전 무작위 → 진짜 정확도 ≈ 0.5

X_sel = SelectKBest(f_classif, k=20).fit_transform(X, y)          # ❌ 전체 데이터로 특징 선택 (누수)
leak = cross_val_score(LogisticRegression(max_iter=500), X_sel, y, cv=5).mean()
pipe = make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression(max_iter=500))
clean = cross_val_score(pipe, X, y, cv=5).mean()                  # ✅ 폴드 안에서만 선택
print(leak > 0.7, abs(clean - 0.5) < 0.2)                         # True True  ← 누수가 가짜 성능을 만든다

X_tr, X_te = train_test_split(X[:, :3], test_size=0.2, random_state=0)
sc = StandardScaler().fit(X_tr)                                   # 훈련 데이터로만 fit
print(np.allclose(sc.transform(X_tr).mean(0), 0))                 # True
```

## 관련 개념
[[train·val·test 분할]] · [[표준화(StandardScaler)]] · [[편향–분산 트레이드오프]] · [[stratify]]
