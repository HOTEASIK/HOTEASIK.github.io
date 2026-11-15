---
title: 역전파(Backpropagation)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 신경망 기초]
tags: [신경망기초, 역전파, AI개론]
---
# 역전파(Backpropagation)

## 정의·핵심
- **정의**: "출력의 오류(Error)를 입력 방향으로 되돌리며 **각 파라미터의 책임을 나누는 과정**" (개론 4차시). 즉 손실을 줄이려면 각 가중치를 어느 방향으로 얼마나 바꿔야 하는지(**기울기 ∂L/∂w**)를 계산한다.
- **학습 4단계 중 3단계 "경사 계산"**: 예측(Forward) → 손실 계산 → **경사 계산(Backprop)** → 파라미터 업데이트
- **세 가지 핵심**
  - **연쇄 법칙(Chain Rule)**: 복잡한 미분을 단계별로 쪼개 **곱셈으로 연결** → [[연쇄 법칙(Chain Rule)]]
  - **기여도 계산**: 손실에 각 가중치가 얼마나 기여했는지
  - **역방향 흐름**: 결과(Output)에서 원인(Input) 방향으로
- **왜 뒤에서 앞으로인가**
  - 결과(Loss)는 **하나**, 원인(가중치)은 **수만~수억 개**
  - 출력에서 시작하면 앞에서 계산한 미분값을 **재사용**하면서 내려갈 수 있어, 모든 파라미터의 기울기를 순전파 한 번 정도의 비용으로 구한다 (하나씩 수치 미분하면 파라미터 수만큼 순전파 필요)
- **PyTorch에서**: `loss.backward()` 한 줄 → Autograd가 계산 그래프를 역순으로 따라가며 기울기를 계산해 각 파라미터의 **`.grad`에 누적** 저장
  - 누적되므로 매 반복마다 `optimizer.zero_grad()`(또는 `W.grad.zero_()`)로 초기화
  - 파라미터 수정은 `torch.no_grad()` 안에서 (그냥 `W -= lr*W.grad`는 RuntimeError: leaf Variable in-place)
- **역전파의 문제**: 층이 깊으면 기울기가 곱해지며 0에 가까워지거나(소실) 커진다(폭주) → [[기울기 소실(Vanishing Gradient)]]

## 수식·원리
```
ŷ = W·X + B,  L = mean((ŷ − Y)²)
∂L/∂ŷ = 2(ŷ − Y)/N
∂L/∂W = Σ ∂L/∂ŷ · X        ∂L/∂B = Σ ∂L/∂ŷ · 1
갱신: W ← W − lr·∂L/∂W
```

## 코드 예시
```python
import torch

X = torch.tensor([-5.0, 5.0, 0.0, 2.0, -2.0])    # 신장 − 평균 (강의 데이터)
Y = torch.tensor([-6.7, 10.3, -3.3, 5.0, -5.3])  # 체중 − 평균
W = torch.tensor(1.0, requires_grad=True)
B = torch.tensor(1.0, requires_grad=True)

loss = ((W * X + B - Y) ** 2).mean()
loss.backward()
print(round(loss.item(), 2), round(W.grad.item(), 2), round(B.grad.item(), 2))   # 13.35 -19.04 2.0  (초기 손실 13.35 = 강의 값)

# 손으로 계산한 기울기와 비교
with torch.no_grad():
    d = 2 * (W * X + B - Y) / len(X)
    print(round((d * X).sum().item(), 2), round(d.sum().item(), 2))              # -19.04 2.0
```

## 관련 개념
[[연쇄 법칙(Chain Rule)]] · [[계산 그래프]] · [[Autograd]] · [[순전파(Forward)]] · [[경사하강법(GD)]] · [[기울기 소실(Vanishing Gradient)]]
