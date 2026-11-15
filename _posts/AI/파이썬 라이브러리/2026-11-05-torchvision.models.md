---
title: torchvision.models
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, torchvision, AI개론]
---
# torchvision.models

## 정의·핵심
- **정의**: 유명한 CNN 구조와 **ImageNet으로 미리 학습한 가중치**를 제공하는 모듈. 전이학습의 출발점.
- **강의에서 쓴 모델** (13~15차시, 응용 5·11·13차시)
  - 분류: `alexnet`, `vgg13`, `vgg19_bn`, `googlenet`, `resnet18`, `resnet50`, `mobilenet_v2`
  - 검출: `detection.fasterrcnn_resnet50_fpn`, `detection.ssd300_vgg16` → [[Faster R-CNN 파인튜닝]]
- **가중치 지정 (최신 방식)**: `models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)` 또는 `weights="DEFAULT"`
  - 옛 방식 `pretrained=True`는 경고가 나고 없어질 예정 (강의 노트북에 섞여 있음)
  - `weights=None`: 구조만, 무작위 초기화
  - 가중치 객체의 `weights.transforms()`로 그 모델에 맞는 전처리를 받을 수 있다
- **출력층 교체**: ImageNet은 1000클래스라 내 클래스 수에 맞게 마지막 층을 바꾼다.
  - ResNet: `net.fc = nn.Linear(net.fc.in_features, n_classes)`
  - VGG·AlexNet: `net.classifier[6] = nn.Linear(4096, n_classes)`
  → [[출력층 교체]]
- **동결**: 특징 추출만 쓰려면 기존 파라미터 `requires_grad=False` 후 새 층만 학습 → [[Feature Extraction vs Fine-tuning]]
- 입력은 보통 `3×224×224` + ImageNet 정규화 통계. CIFAR 32×32를 그대로 넣으면 성능이 떨어져 Resize한다 (13차시 112×112, 224×224 비교).
- 성능표: ImageNet Top-1·Top-5 오류율로 비교 (13차시 표: vgg19_bn Top-1 25.76%)

## 수식·원리
```
사전학습 모델 = features(ImageNet으로 학습된 특징 추출) + fc/classifier(1000 클래스)
전이학습     = features 재사용 + 새 fc(내 클래스 수)
```

## 코드 예시
```python
import torch
import torch.nn as nn
from torchvision import models

net = models.resnet18(weights=None)          # 구조만 (다운로드 없음)
print(net.fc)                                # Linear(in_features=512, out_features=1000, bias=True)
net.fc = nn.Linear(net.fc.in_features, 2)    # ants·bees 2클래스
print(net(torch.randn(1, 3, 224, 224)).shape)   # torch.Size([1, 2])

vgg = models.vgg19_bn(weights=None)
print(vgg.classifier[6])                     # Linear(in_features=4096, out_features=1000, bias=True)

for p in net.parameters():
    p.requires_grad = False
for p in net.fc.parameters():
    p.requires_grad = True
print(sum(p.numel() for p in net.parameters() if p.requires_grad))   # 1026 (fc만 학습)
print(models.ResNet18_Weights.IMAGENET1K_V1.transforms().crop_size)  # [224]
```

## 관련 개념
[[사전학습(Pretrained) 모델]] · [[전이학습(Transfer Learning)]] · [[출력층 교체]] · [[레이어 동결]] · [[ImageNet 정규화 통계]]
