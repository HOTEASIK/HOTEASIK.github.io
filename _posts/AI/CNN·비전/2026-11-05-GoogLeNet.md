---
title: GoogLeNet
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 아키텍처, 대학원, AI응용]
slug: "GoogLeNet-CNN·비전"
---
# GoogLeNet

## 정의·핵심
- **정의**: Google의 CNN (2014, Inception v1). **ILSVRC 2014 1위**, Top-5 오류 6.7%. 22층으로 깊지만 파라미터는 약 **700만 개**(AlexNet의 1/9) (대학원 08, 응용 5차시)
- **문제의식 (대학원 08)**
  - 깊이·너비를 늘리면 성능은 오르지만 **파라미터 폭증 → 과적합, 연산량 폭증**
  - 연결은 **sparse**하게(파라미터 감소), 연산은 **dense**하게(행렬 곱 효율) 하자 → **Inception 모듈** (영화 '인셉션'에서 이름)
- **Inception 모듈**
  - 같은 입력에 **1×1, 3×3, 5×5 합성곱과 3×3 MaxPool을 병렬로** 수행하고 결과를 **채널 방향으로 concat**
  - 서로 다른 크기의 특징(작은 무늬~큰 모양)을 한 번에 추출
  - concat하려면 공간 크기가 같아야 하므로 **padding**으로 크기 유지
  - 3×3·5×5 앞(풀링 뒤)에 **1×1 합성곱으로 차원 축소** → 연산량 112.9M → 5.3M → [[1x1 Convolution]]
- **그 밖의 특징 (대학원 08)**
  - 네트워크 중간의 **1×1 convolution**
  - 끝에서 FC 대신 **Global Average Pooling** → 파라미터 대폭 감소 → [[Global Average Pooling(GAP)]]
  - **보조 분류기(Auxiliary classifier)**: 중간 층 2곳에 작은 분류기를 달아 그 손실도 학습에 더함(가중치 0.3) → 깊은 망의 **기울기 소실 완화**, 정규화 효과. **추론 때는 제거**
- **앙상블 관점 (대학원 08)**: 여러 경로의 출력을 결합하는 구조라 여러 모델을 합치는 앙상블과 비슷한 일반화 효과
- **torchvision**: `models.googlenet(weights=..., aux_logits=...)`, 학습 모드에서 보조 출력까지 반환

## 수식·원리
```
Inception(x) = concat[ 1×1(x),  3×3(1×1(x)),  5×5(1×1(x)),  1×1(MaxPool3×3(x)) ]   (채널 방향)
학습 손실 = L_main + 0.3·(L_aux1 + L_aux2)
```

## 코드 예시
```python
import torch
import torch.nn as nn
from torchvision import models

class Inception(nn.Module):
    def __init__(self, c_in, c1, c3r, c3, c5r, c5, cp):
        super().__init__()
        self.b1 = nn.Conv2d(c_in, c1, 1)
        self.b2 = nn.Sequential(nn.Conv2d(c_in, c3r, 1), nn.ReLU(), nn.Conv2d(c3r, c3, 3, padding=1))
        self.b3 = nn.Sequential(nn.Conv2d(c_in, c5r, 1), nn.ReLU(), nn.Conv2d(c5r, c5, 5, padding=2))
        self.b4 = nn.Sequential(nn.MaxPool2d(3, stride=1, padding=1), nn.Conv2d(c_in, cp, 1))
    def forward(self, x):
        return torch.cat([self.b1(x), self.b2(x), self.b3(x), self.b4(x)], dim=1)

m = Inception(192, 64, 96, 128, 16, 32, 32)              # GoogLeNet inception(3a) 설정
print(m(torch.randn(1, 192, 28, 28)).shape)              # torch.Size([1, 256, 28, 28])  64+128+32+32

g = models.googlenet(weights=None, aux_logits=True, init_weights=True)
print(round(sum(p.numel() for p in g.parameters()) / 1e6, 1))   # 13.0  보조 분류기 포함 (본체만은 6.6)
g.train(); out = g(torch.randn(2, 3, 224, 224))
print(type(out).__name__, out.logits.shape, out.aux_logits1.shape)      # GoogLeNetOutputs torch.Size([2, 1000]) torch.Size([2, 1000])
g.eval(); print(g(torch.randn(1, 3, 224, 224)).shape)    # torch.Size([1, 1000])  추론 때는 본 출력만
```

## 관련 개념
[[1x1 Convolution]] · [[Global Average Pooling(GAP)]] · [[VGG]] · [[기울기 소실(Vanishing Gradient)]] · [[CNN 아키텍처 진화 정리]]
