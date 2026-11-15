---
title: argmax와 max
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, NumPy, PyTorch, AI개론]
---
# argmax와 max

## 정의·핵심
- **max**: 가장 큰 **값**을 돌려준다.
- **argmax**: 가장 큰 값이 있는 **위치(인덱스)** 를 돌려준다.
- **분류에서 argmax가 중요한 이유**: 모델 출력(로짓·확률)에서 가장 큰 값의 **위치가 곧 예측 클래스 번호**다. `[0.1, 0.7, 0.2]` → argmax = 1 → 1번 클래스.
- **axis/dim**: 배치 출력 `(N, 클래스 수)`에서는 클래스 방향인 `axis=1`(`dim=1`)로 구해야 샘플마다 예측 라벨이 나온다.
- **PyTorch `torch.max(x, dim)`**: 값과 인덱스를 **함께** 돌려준다 → `values, indices`
  - 9차시: `torch.max(outputs, 1)[1]` = 예측 라벨 (인덱스 쪽)
  - `outputs.argmax(dim=1)`도 같은 결과
- **Softmax를 거치지 않아도 된다**: Softmax는 순서를 바꾸지 않으므로 로짓의 argmax = 확률의 argmax.
- **item()**: 결과가 원소 1개인 텐서면 `.item()`으로 파이썬 숫자로 꺼낸다. → [[item·numpy 변환]]

## 수식·원리
$$\text{pred}_i = \arg\max_k \; z_{ik}$$
($z_{ik}$: $i$번 샘플의 $k$번 클래스 점수)

## 코드 예시
```python
import numpy as np
import torch

a = np.array([3, 35, 7])
print(a.max(), a.argmax())          # 35 1

outputs = torch.tensor([[2.1, 0.8, -1.3],
                        [0.2, 0.1,  3.0]])   # (N=2, 클래스 3)
values, indices = torch.max(outputs, 1)
print(values)                       # tensor([2.1000, 3.0000])
print(indices)                      # tensor([0, 2])  ← 예측 라벨
print(outputs.argmax(dim=1))        # tensor([0, 2])
print(torch.softmax(outputs, 1).argmax(1))   # tensor([0, 2]) 같음

labels = torch.tensor([0, 1])
print((indices == labels).sum().item())      # 1 (맞힌 개수)
```

## 관련 개념
[[집계 함수와 axis]] · [[예측 라벨 구하기]] · [[Softmax]] · [[item·numpy 변환]]
