---
title: 전이학습(Transfer Learning)
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 전이학습, AI개론, 대학원]
---
# 전이학습(Transfer Learning)

## 정의·핵심
- **정의**: 큰 데이터셋(ImageNet)으로 학습한 모델의 지식을 **새로운 과제·데이터에 옮겨 쓰는 것** (대학원 07: "pre-trained network를 내 데이터에 사용")
- **장점 (대학원 07)**: **더 빠른 학습 진행**, **적은 데이터로도 학습 가능**
- **강의에서의 두 용어 (개론 13차시)**
  - **전이학습(좁은 의미)**: 모델의 **일부 파라미터는 고정(동결)** 하고 **출력에 가까운 파라미터만 학습** → 데이터가 적을 때, 기존 지식 보존, 학습 시간 짧음
  - **파인튜닝**: 사전학습 모델의 **모든 파라미터를 다시 학습** → 데이터가 충분할 때 (CIFAR-10 5만 장)
  - 넓은 의미로는 둘 다 전이학습 → 비교는 [[Feature Extraction vs Fine-tuning]]
- **표준 절차**
  1. 사전학습 모델 불러오기 (`weights=...`)
  2. **출력층을 우리 클래스 수로 교체** (`net.fc = nn.Linear(512, n)`) → [[출력층 교체]]
  3. (선택) 백본 **동결** `requires_grad=False` → [[레이어 동결]]
  4. 학습 가능한 파라미터만 옵티마이저에 전달
  5. **ImageNet 정규화** + 증강으로 데이터 준비 → [[ImageNet 정규화 통계]]
  6. 작은 학습률로 짧게 학습 (강의: SGD lr 0.001, momentum 0.9, 5에폭)
- **옵티마이저 선택 (개론 13차시)**: Adam은 초반이 빠르지만 파인튜닝에서 일반화가 떨어지거나 불안정할 수 있음 → **SGD + Momentum이 더 나은 일반화·안정적 수렴**인 경우가 많다
- **결과 (강의)**: VGG-19-BN 파인튜닝 CIFAR-10 — 1에폭부터 93.67%, 5에폭 **95.76%** (스크래치 CNN 66%와 비교)
- **도메인 차이**: 의료영상·위성처럼 ImageNet과 많이 다르면 더 많은 층을 풀어 학습 (흉부 X-ray 폐렴 분류도 ResNet18 전이학습) → [[Chest X-ray 폐렴 분류]]

## 수식·원리
```
사전학습:  min_θ L_ImageNet(θ)  → θ*
전이:      θ_backbone ← θ*_backbone (고정 또는 작은 lr),  θ_head ← 새로 초기화 → min L_new
```

## 코드 예시
```python
import torch
import torch.nn as nn
from torchvision import models

net = models.resnet18(weights=None)                      # 실제로는 weights="IMAGENET1K_V1"
for p in net.parameters():
    p.requires_grad = False                              # 백본 동결
net.fc = nn.Linear(net.fc.in_features, 2)                # 새 출력층 (학습 대상)
params = [p for p in net.parameters() if p.requires_grad]
print(sum(p.numel() for p in params))                    # 1026  (512*2 + 2)
opt = torch.optim.SGD(params, lr=0.001, momentum=0.9)

x, y = torch.randn(8, 3, 224, 224), torch.randint(0, 2, (8,))
w_before = net.layer1[0].conv1.weight.clone()
loss = nn.CrossEntropyLoss()(net(x), y); opt.zero_grad(); loss.backward(); opt.step()
print(torch.equal(w_before, net.layer1[0].conv1.weight), net.layer1[0].conv1.weight.grad is None)   # True True  백본 그대로
```

## 관련 개념
[[사전학습(Pretrained) 모델]] · [[Feature Extraction vs Fine-tuning]] · [[레이어 동결]] · [[출력층 교체]] · [[Custom Dataset 분류]] · [[SGD(옵티마이저)]]
