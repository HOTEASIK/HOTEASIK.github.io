---
title: 합성곱(Convolution)
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 합성곱, AI개론, 대학원]
---
# 합성곱(Convolution)

## 정의·핵심
- **정의**: 작은 **커널(필터)** 이 이미지 위를 일정 간격으로 이동하면서, 겹친 영역의 값과 커널 값을 **곱해 모두 더해(내적)** 하나의 출력값을 만드는 연산. 결과가 **특징 맵(Feature Map)** (개론 11차시)
- **CNN(합성곱 신경망)**: 사람이 사물을 볼 때 픽셀 나열이 아니라 **선·모서리·질감 같은 특징을 조합**해 인식하는 방식을 흉내 낸 모델. 이미지의 **공간 구조를 유지한 채** 돋보기로 훑듯 특징을 찾는다
- **MLP의 한계를 푸는 3가지 아이디어** (개론 16차시, 대학원 05 LeNet)
  - **Local Connectivity (지역 연결)**: 출력 노드 하나는 입력의 **작은 영역(receptive field)** 에만 연결 → 지역 패턴 인식
  - **Parameter Sharing (가중치 공유)**: **같은 커널을 이미지 전체에 재사용** → 파라미터 수가 이미지 크기와 무관, 위치가 바뀌어도 같은 특징 검출
  - **Spatial Hierarchy (계층적 특징)**: 앞층은 모서리·색 같은 **저수준**, 뒤층은 눈·바퀴 같은 **고수준** 특징
- **핵심 포인트 (강의)**: 커널이 이미지를 스캔 → 특징 맵 생성, **커널 값이 학습되는 파라미터(가중치)**, 공간 정보 유지
- **다채널 합성곱**: 입력이 C_in 채널이면 커널도 **C_in 채널 깊이**를 가지며 채널별 곱을 모두 더해 **출력 1채널**. 이런 커널이 C_out개 → 출력 C_out 채널 (대학원 05: 입력 3채널, 필터 2개 → 출력 2채널)
- **PyTorch**: `nn.Conv2d(in_channels, out_channels, kernel_size, stride=1, padding=0)`
  - weight 모양 `[C_out, C_in, kH, kW]`, bias `[C_out]` (예: `Conv2d(3, 32, 3)` → `[32, 3, 3, 3]`)
- 엄밀히 딥러닝의 합성곱은 커널을 뒤집지 않는 **교차상관(cross-correlation)** 이지만 관례상 합성곱이라 부른다

## 수식·원리
```
Y[o, i, j] = b[o] + Σ_c Σ_m Σ_n  X[c, i·S + m, j·S + n] · K[o, c, m, n]
출력 크기 = (W − F + 2P) / S + 1
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

x = torch.tensor([[1., 2, 0, 1], [0, 3, 1, 2], [2, 1, 0, 3], [1, 0, 2, 1]]).view(1, 1, 4, 4)
k = torch.tensor([[1., 0], [0, -1]]).view(1, 1, 2, 2)
print(F.conv2d(x, k)[0, 0])          # 왼쪽 위 - 오른쪽 아래 (대각선 차이)
# tensor([[-2.,  1., -2.],
#         [-1.,  3., -2.],
#         [ 2., -1., -1.]])
print((x[0, 0, :2, :2] * k[0, 0]).sum())                       # tensor(-2.)  첫 칸을 손으로 계산: 1·1 + 3·(−1)

conv = nn.Conv2d(3, 32, 3)
print(conv.weight.shape, conv.bias.shape)                      # torch.Size([32, 3, 3, 3]) torch.Size([32])
print(conv(torch.randn(100, 3, 32, 32)).shape)                 # torch.Size([100, 32, 30, 30])
```

## 관련 개념
[[커널·필터]] · [[Stride]] · [[Padding]] · [[Feature Map]] · [[수용 영역(Receptive Field)]] · [[출력 크기·파라미터 수 계산]]
