---
title: requires_grad
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# requires_grad

## 정의·핵심
- **정의**: 텐서의 속성. True면 PyTorch가 이 텐서로 하는 연산을 **기록(추적)** 해서 나중에 `backward()`로 이 텐서에 대한 기울기(`.grad`)를 계산한다.
- **누가 True인가**
  - 학습할 파라미터(W, b): True — `nn.Linear` 등의 weight·bias는 **자동으로 True** (7차시)
  - 입력 데이터·정답: False (기본값) — 데이터는 학습 대상이 아니다
  - True인 텐서로 계산한 결과도 True가 되어 `grad_fn`(만든 연산)이 붙는다
- **직접 만들 때**: 4차시처럼 W, B를 손으로 만들면 `torch.tensor(1.0, requires_grad=True)`로 지정해야 기울기가 생긴다.
- **조건**: 기울기는 **실수(float) 텐서만** 가질 수 있다.
- **끄는 경우**
  - **전이학습 레이어 동결**: `for p in net.parameters(): p.requires_grad = False` → 그 층은 학습 안 됨 → [[레이어 동결]]
  - 평가·추론: `torch.no_grad()` 블록 → [[torch.no_grad]]
  - 값만 떼어 내기: `t.detach()`
- **주의 (in-place 오류)**: `requires_grad=True`인 텐서를 `W -= lr * W.grad`처럼 바로 고치면 오류가 난다. 기록 중인 값을 직접 바꾸면 안 되기 때문이다 → `with torch.no_grad():` 안에서 고친다. (4차시 코드 3-13, 3-14)

## 수식·원리
```
W (requires_grad=True) ─┐
x (False) ──────────────┴─▶ Yp = W*x + B ─▶ loss ─backward()─▶ W.grad 채워짐
                              (grad_fn 기록)
```

## 코드 예시
```python
import torch
import torch.nn as nn

l = nn.Linear(1, 1)
print(l.weight.requires_grad)              # True (자동)

W = torch.tensor(1.0, requires_grad=True)
x = torch.tensor(2.0)
y = W * x
print(y.requires_grad, y.grad_fn is not None)   # True True

try:
    W -= 0.1                               # 추적 중 in-place 수정
except RuntimeError:
    print("in-place 오류")                  # in-place 오류
with torch.no_grad():
    W -= 0.1
print(W)                                   # tensor(0.9000, requires_grad=True)

for p in l.parameters():
    p.requires_grad = False                # 동결
print(sum(p.requires_grad for p in l.parameters()))   # 0
```

## 관련 개념
[[Autograd]] · [[torch.no_grad]] · [[레이어 동결]] · [[계산 그래프]]
