---
title: 정규화(Normalize)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 전처리, AI개론]
---
# 정규화(Normalize)

## 정의·핵심
- **용어 주의**: "정규화"는 여러 뜻으로 쓰인다
  - **Min-Max 정규화**: 값을 **0~1 범위**로 `(x − min) / (max − min)` — `MinMaxScaler`
  - **표준화(Z-score)**: 평균 0, 표준편차 1 → [[표준화(StandardScaler)]]
  - **이미지 `transforms.Normalize(mean, std)`**: 채널별로 `(x − mean) / std` — 이름은 Normalize지만 계산은 표준화
  - (다른 것) 층 정규화(BatchNorm·LayerNorm), 규제(regularization)와는 다른 개념
- **이미지 전처리 표준 흐름** (개론 10차시)
  1. `ToTensor()`: PIL/ndarray(0~255, HWC) → 텐서 **0~1**, CHW
  2. `Normalize(0.5, 0.5)`: `(x − 0.5) / 0.5` → **−1~1** 범위 (MNIST 실습)
  3. (MLP용) `Lambda(lambda x: x.view(-1))`로 784차원 펼치기
- **사전학습 모델에는 ImageNet 통계**: `Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])` — 모델이 학습할 때 쓴 것과 **같은 정규화**를 해야 한다 → [[ImageNet 정규화 통계]]
- **왜 정규화하나**: 입력 범위를 0 근처로 맞춰 학습 안정·빠른 수렴, 채널 간 크기 차이 제거
- **평가·추론 때도 똑같이** 적용해야 한다 (학습 때만 하고 추론 때 빼먹는 실수가 흔함)
- **시각화할 때는 되돌리기**: `x * std + mean` 후 0~1로 clip → imshow
- 데이터셋 고유 통계는 훈련 데이터로 계산 (MNIST: 0.1307, 0.3081 / CIFAR10: 채널별)

## 수식·원리
```
Min-Max:   x' = (x − min) / (max − min)          ∈ [0, 1]
Normalize: x' = (x − mean_c) / std_c              (채널 c별)
ToTensor → [0,1] → Normalize(0.5, 0.5) → [−1, 1]
```

## 코드 예시
```python
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

img = Image.fromarray(np.array([[0, 128, 255]], dtype=np.uint8))
tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize(0.5, 0.5)])
x = tf(img)
print(x.shape, [round(v, 3) for v in x.flatten().tolist()])     # torch.Size([1, 1, 3]) [-1.0, 0.004, 1.0]

mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1); std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
rgb = torch.rand(3, 4, 4)
norm = transforms.Normalize(mean.flatten().tolist(), std.flatten().tolist())(rgb)
print(torch.allclose(norm * std + mean, rgb, atol=1e-6))        # True  시각화용 역변환

from sklearn.preprocessing import MinMaxScaler
print(MinMaxScaler().fit_transform([[10.0], [20.0], [30.0]]).ravel().tolist())   # [0.0, 0.5, 1.0]
```

## 관련 개념
[[표준화(StandardScaler)]] · [[transforms]] · [[ImageNet 정규화 통계]] · [[Batch Normalization]]
