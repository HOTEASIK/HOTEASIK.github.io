---
title: arange·linspace·logspace
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, NumPy, AI개론]
---
# arange·linspace·logspace

## 정의·핵심
- **`np.arange(시작, 끝, 간격)`**: 정해진 **간격**으로 수열을 만든다. 끝은 포함하지 않는다.
  - 실수 간격이면 끝값 포함 여부가 부동소수점 오차로 헷갈릴 수 있어 `arange(-2, 2.1, 0.25)`처럼 끝을 살짝 넘겨 쓴다. (활성화 함수 그래프 그릴 때)
- **`np.linspace(시작, 끝, 개수)`**: 정해진 **개수**로 등간격 수를 만든다. 끝을 포함한다.
  - 그래프를 그릴 x축, 회귀 직선 그리기, 결정 경계 그리기에 쓴다.
- **`np.logspace(시작 지수, 끝 지수, 개수)`**: $10^{시작}$ ~ $10^{끝}$을 **로그 간격**으로 만든다.
  - **학습률 탐색**에 쓴다. 학습률은 0.1, 0.01, 0.001처럼 자릿수 단위로 바뀌어야 의미가 있으므로 등간격보다 로그 간격이 맞다. (보충 2_1 하이퍼파라미터 최적화)
- PyTorch에도 `torch.arange`, `torch.linspace`, `torch.logspace`가 있다.

## 수식·원리
- arange: $a,\ a+d,\ a+2d,\ \dots\ (< b)$
- linspace: 간격 $d = \dfrac{b-a}{n-1}$
- logspace: $10^{a},\ 10^{a+d},\ \dots,\ 10^{b}$

## 코드 예시
```python
import numpy as np

print(np.arange(-2.0, 2.1, 1.0))     # [-2. -1.  0.  1.  2.]
print(np.arange(0, 10, 3))           # [0 3 6 9]
print(np.linspace(0, 1, 5))          # [0.   0.25 0.5  0.75 1.  ]
print(np.logspace(-4, -1, 4))        # [0.0001 0.001  0.01   0.1   ]

# 학습률 후보를 로그 간격으로
for lr in np.logspace(-3, -1, 3):
    print(f"lr={lr:g}")              # lr=0.001, lr=0.01, lr=0.1

import torch
x = torch.tensor(np.arange(-2.0, 2.1, 0.25)).float()
print(torch.relu(x)[:3])             # tensor([0., 0., 0.])
```

## 관련 개념
[[ndarray]] · [[plt.plot·scatter]] · [[학습률]] · [[Random Search]]
