---
title: Custom Dataset 분류
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 전이학습, 데이터셋, AI개론]
---
# Custom Dataset 분류

## 정의·핵심
- **정의**: 내장 데이터셋(CIFAR-10 등)이 아니라 **직접 모은 이미지 폴더**로 분류기를 만드는 실습. 개론 15차시 "사용자 데이터 분류" — 개미·벌(ants·bees, hymenoptera), 시베리안 허스키 vs 늑대 예
- **폴더 구조 → `ImageFolder`**
  ```
  data/
    train/ ants/*.jpg  bees/*.jpg
    val/   ants/*.jpg  bees/*.jpg
  ```
  - `datasets.ImageFolder(root, transform)` → **하위 폴더 이름 = 클래스**, **알파벳순**으로 0, 1, … 부여 → [[ImageFolder]]
  - `ds.classes`, `ds.class_to_idx`로 확인
- **전처리 (강의)**
  - 학습: `RandomResizedCrop(224)` 또는 `Resize`, `RandomHorizontalFlip`, `ToTensor`, `Normalize`
  - 검증: `Resize(256)` → `CenterCrop(224)`, `ToTensor`, `Normalize` (증강 없음)
  - **Normalize(0.5, 0.5)의 의미 (강의)**: ToTensor가 픽셀을 [0, 1]로 → (x − 0.5) / 0.5 → **[−1, 1]** 범위. 사전학습 모델이면 ImageNet 통계 사용 → [[ImageNet 정규화 통계]]
- **학습 흐름**: ImageFolder → DataLoader(train은 `shuffle=True`) → 사전학습 ResNet18 → `fc` 교체(2클래스) → 파인튜닝/전이학습 → 검증 정확도·혼동행렬 → 예측 결과 이미지와 함께 출력
- **흔한 문제**
  - 이미지 모드가 섞임(흑백·RGBA) → `loader`에서 `.convert("RGB")` (ImageFolder 기본 loader는 RGB 변환함)
  - 클래스 불균형 → WeightedRandomSampler → [[오버샘플링·언더샘플링]]
  - train/val 폴더가 따로 없으면 `random_split` 또는 `Subset`으로 나누되, **transform이 공유되는 문제**에 주의 (증강이 검증에 섞이지 않게)
  - 숨김 파일(`.ipynb_checkpoints`)이 클래스로 잡힘 → 삭제
- 작은 데이터(클래스당 100~200장)일수록 동결 + 증강이 유리 → [[Feature Extraction vs Fine-tuning]]

## 수식·원리
```
폴더명 정렬: ["ants", "bees"] → {"ants": 0, "bees": 1}
ToTensor: [0, 255] → [0, 1],   Normalize(0.5, 0.5): (x − 0.5)/0.5 → [−1, 1]
```

## 코드 예시
```python
import os, tempfile
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

root = tempfile.mkdtemp()
rng = np.random.default_rng(0)
for split in ("train", "val"):
    for cls in ("bees", "ants"):
        os.makedirs(os.path.join(root, split, cls))
        for i in range(4):
            arr = (rng.random((40, 50, 3)) * 255).astype(np.uint8)
            Image.fromarray(arr).save(os.path.join(root, split, cls, f"{i}.jpg"))

train_tf = transforms.Compose([transforms.RandomResizedCrop(64), transforms.RandomHorizontalFlip(),
                               transforms.ToTensor(), transforms.Normalize(0.5, 0.5)])
val_tf = transforms.Compose([transforms.Resize(72), transforms.CenterCrop(64),
                             transforms.ToTensor(), transforms.Normalize(0.5, 0.5)])
train_ds = datasets.ImageFolder(os.path.join(root, "train"), train_tf)
val_ds = datasets.ImageFolder(os.path.join(root, "val"), val_tf)
print(train_ds.classes, train_ds.class_to_idx, len(train_ds))   # ['ants', 'bees'] {'ants': 0, 'bees': 1} 8

x, y = next(iter(DataLoader(train_ds, batch_size=8, shuffle=True)))
print(x.shape, round(x.min().item(), 2) >= -1.0, x.max().item() <= 1.0)   # torch.Size([8, 3, 64, 64]) True True
net = models.resnet18(weights=None)
net.fc = nn.Linear(net.fc.in_features, len(train_ds.classes))
print(net(x).shape)                                              # torch.Size([8, 2])
```

## 관련 개념
[[ImageFolder]] · [[transforms]] · [[전이학습(Transfer Learning)]] · [[출력층 교체]] · [[DataLoader]] · [[데이터 증강]]
