---
title: Feature Map
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 합성곱, AI개론, 대학원]
---
# Feature Map

## 정의·핵심
- **정의**: 특징 맵. 필터 하나가 입력 전체를 훑고 난 **출력 2차원 배열**. 대학원 강의안에서는 **activation map**이라고도 부른다 — "입력의 특정 위치에 있는 특정 패턴에 반응(activate)하는 필터"의 반응 지도
- **값의 의미**: 그 위치에 필터가 찾는 패턴(예: 세로 모서리)이 **얼마나 강하게 있는지**. 값이 큰 곳 = 그 특징이 있는 곳
- **출력 볼륨**: 필터 C_out개의 특징 맵을 **채널(depth) 방향으로 쌓은 것** → `(N, C_out, H', W')` (대학원 05)
- **층이 깊어질수록**
  - 공간 크기(H, W)는 줄고 (풀링·stride), **채널 수는 늘어난다** (64 → 128 → 256 → 512)
  - 앞층: 모서리·색·질감 같은 **저수준** 특징 / 뒷층: 눈·바퀴·얼굴 같은 **고수준·추상적** 특징
  - "위치 정보"는 줄고 "무엇이 있는가" 정보가 늘어나는 셈
- **활용**
  - 중간 특징 맵을 꺼내 시각화하면 모델이 무엇을 보는지 알 수 있다 → [[Forward Hook]]
  - 마지막 합성곱 층 특징 맵 + 기울기 = **Grad-CAM** 히트맵 → [[Grad-CAM]]
  - 검출·분할 모델은 여러 크기의 특징 맵을 함께 사용 (FPN, SSD)
- 강의 실습(11차시): MNIST 숫자에 같은 커널로 3번 합성곱 → 합성곱을 거칠수록 특정 특징이 강조되는 것을 확인

## 수식·원리
```
Feature map_o = ReLU( Σ_c X_c ⋆ K_{o,c} + b_o )      (o = 0 … C_out−1)
출력 볼륨 = stack(Feature map_0, …, Feature map_{C_out−1})  → (C_out, H', W')
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
features = nn.Sequential(
    nn.Conv2d(3, 32, 3), nn.ReLU(), nn.Conv2d(32, 32, 3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
)
x = torch.randn(1, 3, 32, 32)
for layer in features:
    x = layer(x)
    if not isinstance(layer, nn.ReLU):
        print(type(layer).__name__, tuple(x.shape))    # 공간은 줄고 채널은 늘어남
# Conv2d (1, 32, 30, 30)
# Conv2d (1, 32, 28, 28)
# MaxPool2d (1, 32, 14, 14)
# Conv2d (1, 64, 14, 14)
# MaxPool2d (1, 64, 7, 7)
print(x[0, 0].shape, (x >= 0).all().item())            # torch.Size([7, 7]) True  (ReLU 뒤라 음수 없음)
```

## 관련 개념
[[합성곱(Convolution)]] · [[커널·필터]] · [[Forward Hook]] · [[수용 영역(Receptive Field)]] · [[Grad-CAM]]
