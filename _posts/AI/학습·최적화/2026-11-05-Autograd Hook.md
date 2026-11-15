---
title: Autograd Hook
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 기울기, PyTorch]
---
# Autograd Hook

## 정의·핵심
- **정의**: 순전파·역전파 도중 **특정 텐서나 층을 지나는 값을 가로채서 보거나 바꾸는** 콜백 함수. 모델 코드를 고치지 않고 내부를 관찰할 수 있다
- **종류**
  - **텐서 hook** `tensor.register_hook(fn)`: 그 텐서의 **기울기가 계산될 때** `fn(grad)` 호출. 값을 return하면 기울기를 바꿀 수 있다 (예: 클리핑, 기록)
  - **모듈 forward hook** `module.register_forward_hook(fn)`: `fn(module, input, output)` — 층의 **출력(활성화, 특징맵)** 을 가져올 때 → [[Forward Hook]]
  - **모듈 backward hook** `module.register_full_backward_hook(fn)`: `fn(module, grad_input, grad_output)` — 층을 지나는 **기울기** 관찰
  - 등록하면 handle을 돌려준다 → 다 쓰면 **`handle.remove()`** (안 지우면 계속 실행·메모리 사용)
- **기울기 관찰 용도 (개론 5차시 "Grad 분포" 실습)**
  - 층별 기울기 크기를 기록해 **소실·폭주 진단** → [[기울기 소실(Vanishing Gradient)]]
  - 간단히는 `backward()` 후 `for n, p in model.named_parameters(): p.grad.norm()`으로도 된다 (파라미터 기울기만 볼 때)
  - hook은 **중간 활성화의 기울기**(파라미터가 아닌 것)까지 볼 수 있다
- **다른 쓰임**: Grad-CAM(마지막 conv의 특징맵 + 기울기를 hook으로 가져옴) → [[Grad-CAM]], 특징 추출, 시각화

## 수식·원리
```
forward:  x → layer → out   (forward hook: out 가로채기)
backward: ∂L/∂out → layer → ∂L/∂x   (backward hook: 두 기울기 가로채기)
tensor.register_hook: ∂L/∂tensor 가로채기 (수정 가능)
```

## 코드 예시
```python
import torch
import torch.nn as nn

model = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 1))
grads, acts = {}, {}
h1 = model[0].register_full_backward_hook(lambda m, gi, go: grads.update(l0=go[0].norm().item()))
h2 = model[1].register_forward_hook(lambda m, i, o: acts.update(relu=o.detach()))

x = torch.randn(16, 4, requires_grad=True)
x.register_hook(lambda g: g * 0)                     # 입력 기울기를 0으로 바꿔 버림
model(x).mean().backward()
print("l0" in grads, acts["relu"].shape, x.grad.abs().sum().item())   # True torch.Size([16, 8]) 0.0
for n, p in model.named_parameters():
    print(n, round(p.grad.norm().item(), 3) >= 0)    # 층별 기울기 크기 (True)
h1.remove(); h2.remove()
```

## 관련 개념
[[Forward Hook]] · [[기울기 소실(Vanishing Gradient)]] · [[Grad-CAM]] · [[계산 그래프]] · [[WandB]]
