---
title: reshape·hstack·where
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, NumPy, AI개론]
---
# reshape·hstack·where

## 정의·핵심
- **reshape**: 데이터 순서는 그대로 두고 **모양만 바꾼다.** 전체 요소 수는 같아야 한다.
  - `-1`은 "나머지에 맞춰 자동 계산". `x.reshape(-1, 1)` → `(N, 1)` 열 벡터
  - 딥러닝에서 정답을 `(N,)` → `(N, 1)`로 바꿀 때, 이미지 `(28, 28)` → `(784,)`로 펼 때 쓴다.
  - PyTorch의 `view`·`reshape`와 같은 개념 → [[view·reshape·unsqueeze]]
- **hstack / vstack**: 배열을 가로(열 방향) / 세로(행 방향)로 이어 붙인다.
  - 7차시 보스턴 데이터: 두 줄에 나뉜 한 샘플을 `np.hstack([raw[::2, :], raw[1::2, :2]])`로 합쳐 13개 특징을 만든다.
  - 중회귀에서 특징 열 추가: `np.hstack((x, x_lstat))`
  - 일반형은 `np.concatenate(배열들, axis=)`
- **where**
  - `np.where(조건)` → 조건이 True인 **위치(인덱스)** 를 돌려준다.
  - `np.where(조건, A, B)` → 조건이 True면 A, 아니면 B를 고른다. (벡터화된 if문)
  - 예: 확률을 0/1로 바꾸기, 음수를 0으로(ReLU처럼)

## 수식·원리
```
reshape: [0 1 2 3 4 5] → (2, 3) → [[0 1 2], [3 4 5]]
hstack:  (2,1) + (2,1) → (2,2)
vstack:  (1,3) + (1,3) → (2,3)
where:   where(x>0, x, 0) = max(x, 0)
```

## 코드 예시
```python
import numpy as np

a = np.arange(6)
print(a.reshape(2, 3))             # [[0 1 2] [3 4 5]]
y = np.array([1.0, 2.0, 3.0])
print(y.reshape(-1, 1).shape)      # (3, 1)

rm = np.array([[6.5], [7.1]])
lstat = np.array([[4.9], [9.1]])
print(np.hstack((rm, lstat)))      # [[6.5 4.9] [7.1 9.1]]
print(np.vstack(([1, 2], [3, 4]))) # [[1 2] [3 4]]

x = np.array([-2, 0, 3])
print(np.where(x > 0))             # (array([2]),)
print(np.where(x > 0, x, 0))       # [0 0 3]
```

## 관련 개념
[[view·reshape·unsqueeze]] · [[불리언 인덱싱]] · [[인덱싱·슬라이싱]] · [[단순회귀·중회귀]]
