---
title: 연쇄 법칙(Chain Rule)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 신경망 기초]
tags: [신경망기초, 역전파, 미분, AI개론]
---
# 연쇄 법칙(Chain Rule)

## 정의·핵심
- **정의**: 합성 함수의 미분은 **각 단계 미분의 곱**과 같다는 규칙. `y = f(g(x))`이면 `dy/dx = f'(g(x)) · g'(x)`
- **딥러닝에서 왜 중요한가**: 신경망은 층들의 거대한 합성 함수이므로, 손실을 맨 앞 가중치로 미분하려면 **중간 단계 미분을 차례로 곱하면** 된다. 역전파 = 연쇄 법칙을 출력에서 입력 방향으로 적용하는 알고리즘
- **로컬 미분(Local Gradient)**: 각 연산(곱셈, 덧셈, ReLU…)은 자기 입력에 대한 미분만 알면 된다
  - 덧셈 `z = x + y`: 위에서 온 기울기를 **그대로** 나눠 준다
  - 곱셈 `z = x · y`: 위에서 온 기울기에 **상대 입력을 곱해** 준다
  - ReLU: 입력이 양수면 그대로, 음수면 0
- **분기(경로가 여러 개)**: 한 변수가 여러 경로로 손실에 영향을 주면 각 경로의 기울기를 **더한다** (계산 그래프에서 경로별 기여 합산)
- **곱셈이 쌓이는 결과**: 로컬 미분이 1보다 작으면(Sigmoid는 최대 0.25) 깊이만큼 곱해져 0에 가까워짐 → 기울기 소실

## 수식·원리
```
L = (wx + b − y)²,  u = wx + b − y
∂L/∂w = ∂L/∂u · ∂u/∂w = 2u · x
∂L/∂b = ∂L/∂u · ∂u/∂b = 2u · 1
깊은 망: ∂L/∂W₁ = ∂L/∂a₃ · ∂a₃/∂a₂ · ∂a₂/∂a₁ · ∂a₁/∂W₁
```

## 코드 예시
```python
import torch

x, y = torch.tensor(2.0), torch.tensor(1.0)
w = torch.tensor(3.0, requires_grad=True)
b = torch.tensor(0.5, requires_grad=True)
u = w * x + b - y
L = u ** 2
L.backward()
print(w.grad.item(), b.grad.item())                     # 22.0 11.0
print((2 * u * x).item(), (2 * u).item())               # 22.0 11.0  ← 연쇄 법칙 손계산

s = torch.tensor(0.0, requires_grad=True)
z = torch.sigmoid(torch.sigmoid(torch.sigmoid(s)))      # Sigmoid 3번 합성
z.backward()
print(s.grad.item() < 0.25 ** 3 * 1.01)                 # True (0.25 이하가 3번 곱해짐)
```

## 관련 개념
[[역전파(Backpropagation)]] · [[계산 그래프]] · [[합성 함수]] · [[수치 미분]] · [[기울기 소실(Vanishing Gradient)]]
