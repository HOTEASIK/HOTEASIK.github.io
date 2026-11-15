---
title: torchinfo·torchsummary
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, PyTorch, AI개론]
---
# torchinfo·torchsummary

## 정의·핵심
- **정의**: 모델의 **층별 출력 모양과 파라미터 수**를 표로 보여 주는 도구. Keras의 `model.summary()`를 PyTorch에서 쓰는 셈이다.
  - `torchsummary`: 예전 도구 (`from torchsummary import summary; summary(model, (3,32,32))`)
  - `torchinfo`: 후속 도구, 더 많이 쓴다 (`pip install torchinfo`)
- **왜 보나**
  - 층을 지날 때 **텐서 모양이 맞는지** 확인 (Conv 뒤 Flatten 크기 계산 실수 찾기)
  - **파라미터 수**로 모델 크기 비교 (ResNet18 ≈ 11.7M, VGG16 ≈ 138M)
  - 전이학습에서 동결 후 **학습 가능한 파라미터 수**(Trainable params) 확인 → [[파라미터 동결(Freeze)]]
  - 대략적인 메모리 사용량 추정
- **torchinfo 사용법**: `summary(model, input_size=(배치, C, H, W))` — **배치 차원을 포함**해서 준다 (torchsummary는 배치 빼고)
  - `col_names=["input_size", "output_size", "num_params"]`, `depth=2`로 표시 깊이 조절
- **도구 없이 세기**: `sum(p.numel() for p in model.parameters())`, 학습 가능만 `if p.requires_grad` → [[parameters·named_parameters]]

## 수식·원리
```
Linear(in, out) 파라미터 = in·out + out
Conv2d(Cin, Cout, k)     = Cin·Cout·k·k + Cout
BatchNorm2d(C)           = 2C (γ, β)  ← running mean/var는 파라미터가 아님(버퍼)
```

## 코드 예시
```python
import torch.nn as nn
from torchinfo import summary

model = nn.Sequential(
    nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(), nn.Linear(16 * 16 * 16, 10))
summary(model, input_size=(1, 3, 32, 32))    # 층별 Output Shape, Param # 표

total = sum(p.numel() for p in model.parameters())
print(total)                                 # 41418 = (3*16*9+16) + (4096*10+10)
```

## 관련 개념
[[parameters·named_parameters]] · [[nn.Sequential]] · [[파라미터 동결(Freeze)]] · [[torchviz]]
