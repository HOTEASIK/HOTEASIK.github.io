---
title: transforms
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, torchvision, AI개론]
---
# transforms

## 정의·핵심
- **정의**: 이미지를 모델 입력에 맞게 바꾸는 **전처리 함수 모음**. `torchvision.transforms`. Dataset의 `transform=` 인자로 넘기면 샘플을 꺼낼 때마다 적용된다.
- **기본 4가지** (10차시)
  1. `ToTensor()`: PIL 이미지·NumPy 배열 → 텐서. **[0, 255] 정수를 [0, 1] 실수로** 바꾸고 **HWC → CHW**로 바꾼다.
  2. `Normalize(mean, std)`: $(x - mean) / std$. `Normalize(0.5, 0.5)`면 [0, 1] → **[-1, 1]**. 컬러는 채널별로 3개씩 `Normalize((0.5,0.5,0.5), (0.5,0.5,0.5))`. 사전학습 모델은 ImageNet 통계 `mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]`
  3. `Lambda(함수)`: 임의 함수 적용. MNIST를 MLP에 넣으려고 `Lambda(lambda x: x.view(-1))`로 `[1,28,28]` → `[784]`
  4. `Compose([...])`: 여러 transform을 **순서대로** 묶는다.
- **크기 맞추기**: `Resize(224)`, `Resize((224, 224))`, `CenterCrop(224)` — ResNet 등 사전학습 모델 입력 크기 (응용 12차시: 224×224)
- **데이터 증강용 (훈련 데이터에만)**: `RandomHorizontalFlip(p=0.5)`, `RandomErasing(p=0.5, scale=(0.02, 0.33))`, `RandomResizedCrop`, `ColorJitter`, `RandomRotation` (12차시) → [[데이터 증강]]
  - 검증·테스트용 transform에는 증강을 넣지 않는다 → 훈련용·검증용 transform을 따로 만든다
- **순서 주의**: `RandomErasing`은 **텐서**에 적용하므로 `ToTensor` 뒤에, Flip·Crop 같은 PIL 연산은 앞에 둔다.
- **입력 타입 주의**: Flip·Crop·Resize는 **PIL 이미지나 텐서**만 받는다. NumPy 배열을 넣으면 `TypeError: img should be PIL Image` → `Image.fromarray(arr)`로 바꾼다. (`ToTensor`는 NumPy도 받음)

## 수식·원리
- ToTensor: $x' = x / 255$, shape `(H, W, C)` → `(C, H, W)`
- Normalize(0.5, 0.5): $x'' = (x' - 0.5) / 0.5 \in [-1, 1]$
- 시각화할 때 복원: $x' = x''\cdot std + mean$

## 코드 예시
```python
import numpy as np
import torch
from torchvision import transforms

img = np.full((28, 28, 1), 255, dtype=np.uint8)      # 흰 이미지 (HWC)
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(0.5, 0.5),
    transforms.Lambda(lambda x: x.view(-1)),
])
out = transform(img)
print(out.shape, out.min().item(), out.max().item())  # torch.Size([784]) 1.0 1.0

t = transforms.ToTensor()(np.zeros((32, 32, 3), dtype=np.uint8))
print(t.shape)                                        # torch.Size([3, 32, 32])
print(transforms.Normalize(0.5, 0.5)(t).min().item()) # -1.0

transform_train = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ToTensor(),
    transforms.Normalize(0.5, 0.5),
    transforms.RandomErasing(p=0.5, scale=(0.02, 0.33), ratio=(0.3, 3.3), value=0),
])
from PIL import Image
pil = Image.fromarray(np.zeros((32, 32, 3), dtype=np.uint8))   # Flip은 PIL·텐서만 받음
print(transform_train(pil).shape)                     # torch.Size([3, 32, 32])
```

## 관련 개념
[[Dataset]] · [[데이터 증강]] · [[정규화(Normalize)]] · [[ImageNet 정규화 통계]] · [[lambda 함수]]
