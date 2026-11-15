---
title: Residual Block
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, ResNet, 대학원, AI개론]
---
# Residual Block

## 정의·핵심
- **정의**: 입력 x를 몇 개의 층(F)에 통과시킨 결과에 **입력 x를 그대로 더하는** 블록. `out = ReLU(F(x) + x)`. ResNet의 기본 단위 (대학원 09, 개론 16차시)
- **Basic Block** (ResNet-18/34)
  - Conv3×3 → BN → ReLU → Conv3×3 → BN → (**+ shortcut**) → ReLU
  - 덧셈 **뒤에** 마지막 ReLU
  - 합성곱 뒤에 BN이 오므로 conv의 `bias=False`
- **Bottleneck Block** (ResNet-50/101/152, 대학원 09)
  - **1×1(채널 축소) → 3×3 → 1×1(채널 복원, ×4)**: 3×3은 작은 채널에서만 계산 → 깊어도 연산량 억제
- **Shortcut의 두 종류**
  - **Identity shortcut**: 입력과 출력의 모양이 같을 때 x를 그대로 더함. **파라미터·연산 0**
  - **Projection shortcut**: 크기가 절반(stride 2)이 되거나 채널이 바뀌면 `F(x) + x`를 **더할 수 없다** → x에 **1×1 conv(stride 2) + BN**을 적용해 모양을 맞춤 (대학원 09)
  - 논문의 A/B/C 비교: A(zero-padding, 파라미터 없음), B(차원이 바뀔 때만 projection), C(전부 projection). 차이가 작아 **projection은 degradation 해결에 필수가 아님** → 보통 **B** 사용
- **왜 잘 되는가**
  - 항등이 최적이면 F를 0으로만 만들면 됨 → 학습이 쉬움
  - 역전파에서 shortcut이 **기울기 고속도로** 역할 → [[기울기 소실(Vanishing Gradient)]]
  - 여러 경로를 가진 얕은 망들의 앙상블처럼 동작한다는 해석도 있다
- 이후 Transformer의 `x + Attention(x)`, U-Net 등 거의 모든 현대 구조에 잔차 연결이 들어간다

## 수식·원리
```
identity:    y = ReLU( BN(Conv(ReLU(BN(Conv(x))))) + x )
projection:  y = ReLU( F(x) + BN(Conv1×1_stride2(x)) )
Bottleneck:  C → C/4 (1×1) → C/4 (3×3) → C (1×1)
```

## 코드 예시
```python
import torch
import torch.nn as nn

class BasicBlock(nn.Module):
    def __init__(self, c_in, c_out, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(c_in, c_out, 3, stride, 1, bias=False); self.bn1 = nn.BatchNorm2d(c_out)
        self.conv2 = nn.Conv2d(c_out, c_out, 3, 1, 1, bias=False); self.bn2 = nn.BatchNorm2d(c_out)
        self.shortcut = nn.Sequential()                                 # identity
        if stride != 1 or c_in != c_out:                                # projection
            self.shortcut = nn.Sequential(nn.Conv2d(c_in, c_out, 1, stride, bias=False), nn.BatchNorm2d(c_out))
    def forward(self, x):
        out = torch.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return torch.relu(out + self.shortcut(x))

x = torch.randn(2, 64, 32, 32)
print(BasicBlock(64, 64)(x).shape, BasicBlock(64, 128, stride=2)(x).shape)   # torch.Size([2, 64, 32, 32]) torch.Size([2, 128, 16, 16])
print(sum(p.numel() for p in BasicBlock(64, 64).shortcut.parameters()))      # 0  identity는 파라미터 없음

blk = BasicBlock(8, 8)
for m in (blk.conv1, blk.conv2): nn.init.zeros_(m.weight)                   # F(x)=0이면
x = torch.rand(1, 8, 4, 4)
blk.eval(); print(torch.allclose(blk(x), x))                                # True  블록이 항등 함수가 됨
```

## 관련 개념
[[ResNet]] · [[ResNet18 스크래치 구현]] · [[1x1 Convolution]] · [[Batch Normalization]] · [[기울기 소실(Vanishing Gradient)]]
