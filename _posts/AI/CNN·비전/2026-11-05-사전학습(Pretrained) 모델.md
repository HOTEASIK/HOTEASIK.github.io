---
title: 사전학습(Pretrained) 모델
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 전이학습, AI개론]
---
# 사전학습(Pretrained) 모델

## 정의·핵심
- **정의**: ImageNet 같은 **대규모 데이터셋으로 미리 학습된 신경망**. 수백만 장의 이미지로 이미 다양한 사물과 개념을 학습한 상태 (개론 13차시)
- **비유 (강의)**: 수많은 책을 읽어 폭넓은 지식을 갖춘 '달인' — 새 전문 분야를 가르치면 아무것도 모르는 사람보다 **훨씬 빠르고 깊이** 배운다
- **왜 효과가 있나**: 모델이 이미지의 **기본 특징(선·면·질감 등)을 이미 알고 있어서**, 새 분류 문제를 더 빠르고 정확하게 학습한다
  - 앞층 특징(모서리·색)은 거의 모든 이미지 과제에 공통 → 재사용 가치가 크다
  - 데이터가 적어도 과적합이 덜하고, 학습 시간이 짧다
- **torchvision.models** (개론 13차시): AlexNet, VGG, ResNet 등 유명 모델을 **함수 호출 한 번**으로 제공
  - 구버전: `models.resnet18(pretrained=True)` (강의 코드, 현재는 경고)
  - 신버전: `models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)` 또는 `weights="DEFAULT"`
  - `weights=None`: 구조만 (무작위 초기화)
  - 가중치는 처음 한 번 `~/.cache/torch/hub/checkpoints`에 다운로드
  - `Weights.transforms()`로 그 모델이 학습된 **전처리**(Resize·정규화)를 그대로 얻을 수 있다
- **사용 시 지켜야 할 것**
  - 입력: 3채널 RGB, 보통 **224×224** (작은 이미지는 Resize — 강의는 CIFAR 32→112, 시간·성능 균형)
  - **ImageNet 평균·표준편차로 정규화** → [[ImageNet 정규화 통계]]
  - 출력층은 **1000개 클래스** → 우리 클래스 수로 교체 → [[출력층 교체]]
- **다른 출처**: timm(수백 개 모델) → [[timm]], Hugging Face, ultralytics(YOLO)
- 성능 표(Top-1/Top-5 에러): AlexNet 43.45/20.91, VGG-19-BN 25.76/8.15, ResNet-18 30.24/10.92, ResNet-152 21.69/5.94

## 수식·원리
```
θ_init = θ_ImageNet  (무작위 초기화 대신)
→ 새 데이터로 짧게 학습 (전이학습 / 파인튜닝)
```

## 코드 예시
```python
import torch
from torchvision import models

w = models.ResNet18_Weights.IMAGENET1K_V1
print(len(w.meta["categories"]), w.meta["categories"][:3])     # 1000 ['tench', 'goldfish', 'great white shark']
print(w.transforms())                                          # Resize 256 → CenterCrop 224 → ImageNet 정규화
net = models.resnet18(weights=None)                            # 구조만 (다운로드 없이)
# net = models.resnet18(weights=w)                             # 사전학습 가중치 (첫 실행 시 다운로드)
print(net.fc.out_features)                                     # 1000
net.eval()
with torch.no_grad():
    print(net(torch.randn(1, 3, 224, 224)).softmax(1).sum().item() > 0.999)   # True
```

## 관련 개념
[[전이학습(Transfer Learning)]] · [[Feature Extraction vs Fine-tuning]] · [[출력층 교체]] · [[ImageNet 정규화 통계]] · [[torchvision.models]] · [[ImageNet·ILSVRC]]
