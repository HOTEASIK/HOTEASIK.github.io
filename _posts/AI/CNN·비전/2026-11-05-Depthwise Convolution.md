---
title: Depthwise Convolution
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 합성곱, 경량화]
---
# Depthwise Convolution

## 정의·핵심
- **정의**: 채널마다 **자기 전용 커널 하나만** 적용하는 합성곱. 채널끼리 섞지 않는다. PyTorch `nn.Conv2d(C, C, k, groups=C)`
- **일반 합성곱과 비교**
  - 일반: 출력 채널 하나가 **모든 입력 채널**을 본다 → 공간 + 채널을 한꺼번에 처리
  - Depthwise: 입력 채널 c → 출력 채널 c (1:1), **공간 정보만** 처리
- **Depthwise Separable Convolution** = **Depthwise(공간) + Pointwise 1×1(채널 섞기)**
  - 일반 합성곱을 두 단계로 나눠 거의 같은 역할을 **훨씬 적은 계산**으로
  - 3×3, 채널 많을 때 연산·파라미터가 약 **1/8~1/9**
  - **MobileNet·Xception·EfficientNet**의 핵심 → [[MobileNet(언급)]]
- **groups 인자**
  - `groups=1`: 일반 합성곱
  - `groups=C_in`: depthwise (C_out은 C_in의 배수)
  - 그 사이 값: 그룹 합성곱 (AlexNet은 GPU 2개에 나누려고 groups=2 사용, ResNeXt)
- **장단점**: 모바일·엣지 기기에서 빠르고 작다 / 표현력이 조금 낮아질 수 있고, GPU에서는 FLOPs 감소만큼 빨라지지 않을 때도 있다 (메모리 접근 비중↑)

## 수식·원리
```
일반 Conv 파라미터:      k² · C_in · C_out
Depthwise + Pointwise:  k² · C_in + C_in · C_out
비율 = 1/C_out + 1/k²   (k=3, C_out=256 → 약 0.115)
```

## 코드 예시
```python
import torch
import torch.nn as nn

C_in, C_out = 64, 128
normal = nn.Conv2d(C_in, C_out, 3, padding=1, bias=False)
separable = nn.Sequential(
    nn.Conv2d(C_in, C_in, 3, padding=1, groups=C_in, bias=False),   # depthwise
    nn.Conv2d(C_in, C_out, 1, bias=False),                          # pointwise
)
count = lambda m: sum(p.numel() for p in m.parameters())
x = torch.randn(1, C_in, 32, 32)
print(normal(x).shape == separable(x).shape)              # True  출력 모양 같음
print(count(normal), count(separable), round(count(separable) / count(normal), 3))   # 73728 8768 0.119

dw = nn.Conv2d(3, 3, 3, padding=1, groups=3, bias=False)
x = torch.zeros(1, 3, 5, 5); x[0, 1] = 1.0                # 1번 채널에만 값
print(dw(x)[0].abs().sum(dim=(1, 2)).gt(0).tolist())      # [False, True, False]  채널끼리 안 섞임
```

## 관련 개념
[[1x1 Convolution]] · [[MobileNet(언급)]] · [[합성곱(Convolution)]] · [[출력 크기·파라미터 수 계산]]
