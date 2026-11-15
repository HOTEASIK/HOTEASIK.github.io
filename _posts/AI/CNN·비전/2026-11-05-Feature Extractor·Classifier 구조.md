---
title: Feature Extractor·Classifier 구조
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 모델구조, AI개론, 대학원]
---
# Feature Extractor·Classifier 구조

## 정의·핵심
- **정의**: CNN을 **특징 추출부(features)** 와 **분류부(classifier)** 두 덩어리로 나눠 보는 구조 (개론 11·16차시)
  - **Feature Extractor**: Conv → ReLU → (BN) → Pool 반복. 이미지에서 중요한 **패턴과 특징을 찾아내고 정보를 압축**
  - **Classifier**: Flatten(또는 GAP) → FC → ReLU → (Dropout) → FC. 추출된 특징을 보고 **무엇인지 판단**
- **처리 흐름 (개론 11차시)**: 특징 추출 → 정보 압축 → 최종 분류
- **고전 비전과의 차이 (대학원 05)**
  - 전통 방식: 사람이 설계한 특징 추출(HOG 등) + 학습되는 분류기(SVM)
  - CNN: **특징 추출부와 분류부 모두 학습** (end-to-end)
- **PyTorch 구현 관례**
  - `self.features = nn.Sequential(...)`, `self.classifier = nn.Sequential(...)`로 역할별 그룹화 → 코드가 깔끔하고 읽기 쉽다 (개론 11차시)
  - `forward`: `x = self.features(x)` → `x = self.flatten(x)` → `x = self.classifier(x)`
  - `__init__`: 필요한 부품(레이어) 정의 / `forward`: 데이터가 흘러갈 길(조립 순서) 정의
  - torchvision도 같은 이름: `vgg.features`, `vgg.classifier`, `alexnet.features`. ResNet은 `fc`가 분류부
- **전이학습과 직결**: 사전학습 모델의 **features는 재사용(동결)**, **classifier만 새로 학습** → [[Feature Extraction vs Fine-tuning]]
- 분리해 두면 특징 벡터만 뽑아 다른 용도(검색, 클러스터링, t-SNE)에 쓰기도 쉽다

## 수식·원리
```
이미지 ─[features: (Conv→ReLU→Pool)×n]─▶ 특징 맵 (C,H,W) ─Flatten/GAP─▶ 벡터 ─[classifier: FC…]─▶ 로짓 (K)
```

## 코드 예시
```python
import torch
import torch.nn as nn

class CNN(nn.Module):                                    # 개론 11차시 CIFAR-10 모델
    def __init__(self, n_output=10, n_hidden=128):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3), nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3), nn.ReLU(inplace=True), nn.MaxPool2d((2, 2)))
        self.flatten = nn.Flatten()
        self.classifier = nn.Sequential(nn.Linear(6272, n_hidden), nn.ReLU(inplace=True), nn.Linear(n_hidden, n_output))
    def forward(self, x):
        return self.classifier(self.flatten(self.features(x)))

net = CNN()
x = torch.randn(100, 3, 32, 32)
print(net.features(x).shape, net(x).shape)               # torch.Size([100, 32, 14, 14]) torch.Size([100, 10])
count = lambda m: sum(p.numel() for p in m.parameters())
print(count(net.features), count(net.classifier))        # 10144 804234  파라미터는 분류부에 몰림
for p in net.features.parameters():
    p.requires_grad = False                              # 전이학습식: 특징 추출부 동결
print(sum(p.numel() for p in net.parameters() if p.requires_grad))   # 804234
```

## 관련 개념
[[합성곱(Convolution)]] · [[풀링]] · [[Flatten]] · [[Fully Connected 층]] · [[Feature Extraction vs Fine-tuning]] · [[nn.Sequential]]
