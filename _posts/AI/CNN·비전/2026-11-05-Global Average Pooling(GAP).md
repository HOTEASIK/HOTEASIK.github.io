---
title: Global Average Pooling(GAP)
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 풀링, AI개론, 대학원]
---
# Global Average Pooling(GAP)

## 정의·핵심
- **정의**: 특징 맵 **채널 하나 전체(H×W)를 평균 내어 숫자 하나**로 만드는 풀링. `(N, C, H, W)` → `(N, C, 1, 1)` → Flatten → `(N, C)`
- **등장**: Network in Network에서 제안, **GoogLeNet**이 네트워크 끝에서 **FC층 대신 GAP**을 사용 (대학원 08). 이후 ResNet·MobileNet 등 대부분의 현대 CNN이 채택
- **PyTorch**: `nn.AdaptiveAvgPool2d((1, 1))` 또는 `x.mean(dim=(2, 3))`
  - Adaptive: **출력 크기를 지정** → 입력이 16×16이든 8×8이든 항상 1×1 (개론 13차시 "CNN 모델의 유연성 담당")
  - torchvision ResNet의 `avgpool`이 바로 이것 → `fc = Linear(512, 1000)`
- **장점**
  - **파라미터 0개**: 마지막 특징 맵(예: 512×7×7 = 25,088)을 Flatten해서 FC에 넣는 것보다 파라미터가 훨씬 적다 → **과적합 감소**
  - **입력 크기 자유**: 224×224로 학습한 모델에 다른 크기를 넣어도 FC 입력 크기가 그대로 (CIFAR 32×32를 112로 키워 넣어도 동작)
  - 채널 = "그 특징이 이미지 어딘가에 얼마나 있는가" → 해석이 쉽다. **CAM(Class Activation Map)** 의 기반 → [[Grad-CAM]]
- **단점**: 공간 위치 정보를 버린다 → 분류엔 좋지만 위치가 중요한 과제(검출·분할)에는 그대로 쓰지 않는다
- 비교: Global Max Pooling (`AdaptiveMaxPool2d(1)`) — 가장 강한 반응만

## 수식·원리
```
GAP(x)_c = (1 / (H·W)) Σ_i Σ_j x[c, i, j]
Flatten 방식: 512·7·7·1000 ≈ 2,500만 파라미터  vs  GAP 방식: 512·1000 ≈ 51만
```

## 코드 예시
```python
import torch
import torch.nn as nn

gap = nn.AdaptiveAvgPool2d((1, 1))
for s in (16, 8, 7):
    print(gap(torch.randn(100, 32, s, s)).shape)          # 항상 torch.Size([100, 32, 1, 1])
x = torch.randn(2, 512, 7, 7)
print(torch.allclose(gap(x).flatten(1), x.mean(dim=(2, 3))))   # True

flat_fc = nn.Linear(512 * 7 * 7, 1000)
gap_fc = nn.Linear(512, 1000)
count = lambda m: sum(p.numel() for p in m.parameters())
print(count(flat_fc), count(gap_fc))                       # 25089000 513000

head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(512, 10))
print(head(torch.randn(4, 512, 7, 7)).shape, head(torch.randn(4, 512, 3, 3)).shape)   # 입력 크기가 달라도 (4, 10)
```

## 관련 개념
[[풀링]] · [[GoogLeNet]] · [[ResNet]] · [[Flatten]] · [[Fully Connected 층]] · [[Grad-CAM]]
