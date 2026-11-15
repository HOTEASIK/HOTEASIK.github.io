---
title: seaborn heatmap
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, Seaborn, AI개론]
---
# seaborn heatmap

## 정의·핵심
- **Seaborn**: Matplotlib 위에 만든 통계 시각화 라이브러리. 적은 코드로 보기 좋은 그래프를 그린다. `import seaborn as sns`
- **`sns.heatmap(행렬)`**: 2차원 행렬의 값을 **색의 진하기**로 보여 준다.
- **딥러닝에서 주로 쓰는 곳: 혼동행렬 시각화** (8·10차시)
  - 행 = 실제 클래스, 열 = 예측 클래스
  - 대각선이 진할수록 잘 맞힌 것, 대각선 밖 진한 칸 = 자주 헷갈리는 클래스 쌍 (예: MNIST 8↔3)
  - `annot=True`: 칸에 숫자 표시, `fmt='d'`: 정수로 표시 (정규화한 비율이면 `'.2f'`)
  - `cmap='Blues'`: 색 지정, `xticklabels`·`yticklabels`: 클래스 이름
- **정규화한 혼동행렬**: 각 행을 행의 합으로 나누면 "실제 클래스별 재현율"이 대각선에 나온다. 클래스 개수가 불균형할 때 보기 좋다. (10차시 `cm / cm.sum(axis=1, keepdims=True)`)
- 그 밖의 쓰임: 특징끼리의 상관계수 행렬(`np.corrcoef`), Attention 가중치 시각화

## 수식·원리
```
              예측 0   예측 1
실제 0  [[   TN      FP ],
실제 1   [   FN      TP ]]
정규화: cm[i, :] / cm[i, :].sum()
```

## 코드 예시
```python
import numpy as np
from sklearn.metrics import confusion_matrix

y_true = [0, 0, 1, 1, 2, 2, 2, 1]
y_pred = [0, 1, 1, 1, 2, 2, 1, 1]
cm = confusion_matrix(y_true, y_pred)
print(cm)                                  # [[1 1 0] [0 3 0] [0 1 2]]
cm_norm = cm / cm.sum(axis=1, keepdims=True)
print(np.round(cm_norm.diagonal(), 2))     # [0.5  1.   0.67] 클래스별 재현율

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["A", "B", "C"], yticklabels=["A", "B", "C"])
plt.xlabel("Predicted"); plt.ylabel("Actual")
plt.savefig("cm.png")
```

## 관련 개념
[[혼동행렬]] · [[재현율(Recall)]] · [[Classification Report]] · [[scikit-learn]]
