---
title: MobileNet
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 아키텍처, 경량화]
---
# MobileNet

## 정의·핵심
- **정의**: Google의 **모바일·임베디드용 경량 CNN** (2017~). 정확도를 조금 양보하고 **파라미터·연산량을 크게 줄여** 휴대폰·로봇·엣지 기기에서 실시간 추론 (강의에서는 경량 모델 예로 언급)
- **핵심: Depthwise Separable Convolution**
  - 일반 3×3 합성곱을 **depthwise 3×3(채널별 공간 처리) + pointwise 1×1(채널 섞기)** 로 분리
  - 연산량 약 **1/8~1/9** → [[Depthwise Convolution]]
- **버전별 아이디어**
  - **V1**: depthwise separable conv 쌓기 + **width multiplier α**(채널 수 비율), **resolution multiplier ρ**(입력 해상도)로 크기·속도 조절
  - **V2**: **Inverted Residual + Linear Bottleneck** — 1×1로 채널을 **넓히고**(확장) → depthwise 3×3 → 1×1로 **좁힘**(마지막에 ReLU 없음), 좁은 쪽끼리 잔차 연결. 활성화는 ReLU6
  - **V3**: NAS(자동 구조 탐색) + SE(Squeeze-Excitation) + h-swish
- **크기 비교 (torchvision)**: MobileNetV2 약 **350만**, MobileNetV3-Small 약 250만 vs ResNet-18 1,170만, VGG16 1.38억
- **쓰임**: 모바일 분류, SSD-Lite·DeepLab 경량 백본, 로봇·드론. ONNX/TensorRT로 변환해 배포 → [[ONNX]], [[TensorRT]]
- 비슷한 계열: ShuffleNet, EfficientNet(복합 스케일링), SqueezeNet

## 수식·원리
```
Inverted Residual (V2):  x(C) ─1×1 확장─▶ tC ─DW 3×3─▶ tC ─1×1 선형─▶ C  (+ x)
연산량 비율 ≈ 1/C_out + 1/k²
```

## 코드 예시
```python
import torch
from torchvision import models

count = lambda m: round(sum(p.numel() for p in m.parameters()) / 1e6, 2)
mb = models.mobilenet_v2(weights=None)
print(count(mb), count(models.mobilenet_v3_small(weights=None)), count(models.resnet18(weights=None)))   # 3.5 2.54 11.69
blk = mb.features[2]                                     # Inverted Residual 블록 하나
dw = [m for m in blk.modules() if isinstance(m, torch.nn.Conv2d) and m.groups > 1][0]
print(dw.groups == dw.in_channels, dw.kernel_size)       # True (3, 3)  depthwise
print(mb.classifier[-1])                                 # Linear(in_features=1280, out_features=1000, bias=True)
print(mb(torch.randn(1, 3, 224, 224)).shape)             # torch.Size([1, 1000])
```

## 관련 개념
[[Depthwise Convolution]] · [[1x1 Convolution]] · [[Residual Block]] · [[CNN 아키텍처 진화 정리]] · [[ONNX]]
