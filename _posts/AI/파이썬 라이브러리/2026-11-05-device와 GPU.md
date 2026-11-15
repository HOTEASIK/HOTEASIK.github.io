---
title: device와 GPU
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# device와 GPU

## 정의·핵심
- **왜 GPU인가**: MNIST만 해도 학습 데이터가 6만 장이다. 신경망 학습은 거대한 행렬 곱의 반복인데, GPU는 수천 개 코어로 이를 **병렬** 처리해 CPU보다 훨씬 빠르다. (10차시)
- **device**: 텐서·모델이 계산될 장치. `'cpu'` 또는 `'cuda:0'`(첫 번째 NVIDIA GPU)
- **표준 코드**: `device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")`
  - `torch.cuda.is_available()`: CUDA(NVIDIA GPU)를 쓸 수 있으면 True
- **`.to(device)`로 옮길 것 세 가지**
  1. 모델: `net = Net().to(device)` (파라미터가 옮겨짐)
  2. 입력: `inputs = inputs.to(device)`
  3. 정답: `labels = labels.to(device)`
  - 미니배치마다 루프 안에서 입력·정답을 옮긴다.
- **가장 흔한 오류**: 모델은 GPU, 데이터는 CPU처럼 **장치가 섞이면** `RuntimeError: Expected all tensors to be on the same device`가 난다.
- **다시 CPU로**: 그래프·sklearn에 넘길 때 `.cpu()` → [[item·numpy 변환]]
- 모델은 `.to()`가 제자리 변경이지만 텐서는 **새 텐서를 돌려준다** → `x = x.to(device)`처럼 다시 대입해야 한다.
- Colab은 런타임 유형을 GPU로 바꿔야 `cuda`가 잡힌다. → [[Google Colab]]

## 수식·원리
```
model.to(device)   ← 한 번
for x, y in loader:
    x, y = x.to(device), y.to(device)   ← 배치마다
    out = model(x)     (모두 같은 device)
```

## 코드 예시
```python
import torch
import torch.nn as nn

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(device.type in ("cuda", "cpu"))     # True

net = nn.Linear(784, 10).to(device)
x = torch.randn(4, 784)
x = x.to(device)                          # 다시 대입
print(net(x).device == next(net.parameters()).device)   # True

if device.type == "cuda":
    try:
        net(torch.randn(4, 784))          # CPU 입력 → 오류
    except RuntimeError:
        print("device 불일치")
```

## 관련 개념
[[Tensor 생성]] · [[GPU·CUDA]] · [[item·numpy 변환]] · [[DataLoader 속도]] · [[Google Colab]]
