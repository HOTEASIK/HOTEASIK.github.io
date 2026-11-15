---
title: 1x1 Convolution
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 합성곱, 대학원]
---
# 1x1 Convolution

## 정의·핵심
- **정의**: 커널 크기가 **1×1**인 합성곱. 공간(가로·세로)으로는 아무것도 섞지 않고, **한 위치의 채널 값들만** 섞는다 (대학원 07·08)
- **동작 (대학원 강의 예)**: 6×6×32 입력에 1×1×32 필터 → 36개 위치 각각에서 **32개 입력 값과 필터 32개 값의 내적**을 구하고 ReLU 적용. 위치마다 작은 FC층(`Linear(32, C_out)`)을 적용하는 것과 같다
- **용도**
  - **차원(채널) 축소**: 큰 합성곱 앞에 두어 채널을 줄이면 **연산량이 크게 감소** — GoogLeNet의 핵심 (대학원 08)
  - **차원 복원·확장**: ResNet **Bottleneck** 블록 1×1(축소) → 3×3 → 1×1(복원) (대학원 09)
  - **비선형 추가**: 1×1 + ReLU로 크기 변화 없이 표현력 증가 (Network in Network)
  - **채널 수 맞추기**: Residual의 **projection shortcut** (`1×1 conv, stride 2`) → [[Residual Block]]
  - Depthwise Separable Conv의 **pointwise** 단계 → [[Depthwise Convolution]]
- **연산량 계산 (대학원 08, GoogLeNet)**: 14×14×480 입력 → 5×5 conv 48채널
  - 바로 하면: (14×14×48) × (5×5×480) = **112.9M**
  - 1×1로 16채널로 줄인 뒤: 1×1 = (14×14×16)×(1×1×480) = 1.5M, 5×5 = (14×14×48)×(5×5×16) = 3.8M → 합계 **5.3M** (약 1/21)
- 깊이·너비를 늘려도 연산량이 크게 늘지 않게 해 주는 "병목(bottleneck)" 장치

## 수식·원리
```
y[o, i, j] = Σ_c W[o, c] · x[c, i, j] + b[o]       ← 위치마다 Linear(C_in → C_out)
Params = C_in · C_out + C_out
```

## 코드 예시
```python
import torch
import torch.nn as nn

x = torch.randn(1, 32, 6, 6)
conv1 = nn.Conv2d(32, 8, kernel_size=1)
y = conv1(x)
print(y.shape)                                                  # torch.Size([1, 8, 6, 6])  공간 유지, 채널 32→8
fc = nn.Linear(32, 8)
fc.weight.data = conv1.weight.data.view(8, 32); fc.bias.data = conv1.bias.data
print(torch.allclose(y, fc(x.permute(0, 2, 3, 1)).permute(0, 3, 1, 2), atol=1e-6))   # True  위치별 Linear와 같음

direct = (14 * 14 * 48) * (5 * 5 * 480)
reduced = (14 * 14 * 16) * (1 * 1 * 480) + (14 * 14 * 48) * (5 * 5 * 16)
print(round(direct / 1e6, 1), round(reduced / 1e6, 1))          # 112.9 5.3  (GoogLeNet 예)
```

## 관련 개념
[[GoogLeNet]] · [[Residual Block]] · [[Depthwise Convolution]] · [[합성곱(Convolution)]] · [[MobileNet(언급)]]
