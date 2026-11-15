---
title: 기울기 소실(Vanishing Gradient)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 기울기, AI개론]
---
# 기울기 소실(Vanishing Gradient)

## 정의·핵심
- **정의**: 역전파 중 기울기가 **입력층 쪽으로 갈수록 점점 작아져 0에 가까워지는** 현상. 앞쪽 층의 가중치가 거의 업데이트되지 않아 **깊은 망이 학습되지 않는다**
- **원인**: 연쇄 법칙에서 층마다 **1보다 작은 값이 계속 곱해진다** → [[연쇄 법칙(Chain Rule)]]
  - **Sigmoid**: 도함수 최대 **0.25** → 10층이면 0.25¹⁰ ≈ 10⁻⁶ (개론 4차시 "치명적 단점: 양 끝단 포화 영역에서 기울기 소실")
  - Tanh: 최대 1이지만 포화 영역에서 0
  - 작은 가중치 초기화, **RNN의 긴 시퀀스**(같은 가중치 반복 곱)
- **증상**: 손실이 거의 줄지 않음, 앞쪽 층 `.grad`의 크기가 뒤쪽보다 수십~수천 배 작음, 12차시 CNN_v2처럼 **초반 몇 에폭 정확도가 10%에 머묾**
- **해결책**
  1. **ReLU 계열 활성화** (양수 기울기 1) → [[ReLU]]
  2. **He/Xavier 초기화** → [[He(Kaiming) 초기화]]
  3. **Batch Normalization** → [[Batch Normalization]]
  4. **Residual(Skip) Connection**: `y = F(x) + x` → 기울기가 지름길로 바로 전달 → [[Residual Block]]
  5. RNN은 **LSTM·GRU**(게이트 구조) → [[LSTM]]
  6. Adam 같은 적응형 옵티마이저 (작은 기울기도 보폭을 키움)
- **관찰**: `named_parameters()`로 층별 `grad.norm()`을 찍거나, Hook·WandB `watch`로 분포 확인 (개론 5차시 "Grad 분포" 실습) → [[Autograd Hook]]

## 수식·원리
```
∂L/∂W₁ = ∂L/∂aₙ · Πₖ (f'(zₖ) · Wₖ) · ∂a₁/∂W₁
f' ≤ 0.25 (Sigmoid), n층 → 최대 0.25ⁿ 배
```

## 코드 예시
```python
import torch
import torch.nn as nn

def first_layer_grad(act):
    torch.manual_seed(0)
    layers = []
    for _ in range(10):
        layers += [nn.Linear(64, 64), act()]
    net = nn.Sequential(*layers, nn.Linear(64, 1))
    net(torch.randn(32, 64)).pow(2).mean().backward()
    return net[0].weight.grad.norm().item(), net[-1].weight.grad.norm().item()

for act in (nn.Sigmoid, nn.ReLU):
    f, l = first_layer_grad(act)
    print(act.__name__, f"{f / l:.0e}")   # 첫 층 / 마지막 층 기울기 비율
# Sigmoid 8e-10   ← 거의 0, 앞쪽 층은 학습 안 됨
# ReLU    6e-04   ← 기본 초기화라 여전히 줄지만 Sigmoid보다 약 70만 배 큼 (He 초기화·BN·Residual로 더 개선)
```

## 관련 개념
[[기울기 폭주(Exploding Gradient)]] · [[Sigmoid]] · [[ReLU]] · [[Residual Block]] · [[Batch Normalization]] · [[Autograd Hook]]
