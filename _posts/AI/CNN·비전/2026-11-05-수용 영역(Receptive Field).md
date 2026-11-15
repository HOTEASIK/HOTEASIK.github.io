---
title: 수용 영역(Receptive Field)
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, 합성곱, 대학원]
---
# 수용 영역(Receptive Field)

## 정의·핵심
- **정의**: 출력(특징 맵)의 픽셀 하나가 **원본 입력에서 바라보는 영역의 크기**. 그 픽셀 값에 영향을 주는 입력 범위 (대학원 05)
- **Local Connectivity와의 관계 (대학원 05)**: 고차원 이미지에서 노드 하나를 이전 층 전체와 연결하는 것은 비효율적 → 각 노드를 입력의 **로컬 영역에만** 연결. 이 영역이 receptive field
- **층을 쌓으면 커진다**
  - 3×3 합성곱 1층: 3×3
  - 3×3 두 번: **5×5**, 세 번: **7×7**
  - 풀링·stride가 끼면 훨씬 빠르게 커진다 (뒤층의 한 칸이 원본의 여러 칸을 대표)
  - 깊은 층일수록 넓은 영역 → 큰 물체·전체 맥락을 볼 수 있다
- **VGG의 핵심 논리 (대학원 07)**
  - 7×7 한 번 = 3×3 세 번과 **같은 수용 영역**
  - 가중치 수(채널 1 기준): 7×7 = **49** vs 3×3×3 = **27** → 파라미터 감소
  - 비선형(ReLU)이 3번 들어가 **표현력 증가** → "동일한 receptive field에 더 추상적인 정보"
- **설계 의미**
  - 분류: 마지막 층의 수용 영역이 물체 전체를 덮어야 한다
  - 검출·분할: 작은 물체는 얕은 층(작은 RF), 큰 물체는 깊은 층(큰 RF) 특징 맵에서 찾는다
  - 실제로 영향이 큰 영역(effective RF)은 이론값보다 작고 중심에 몰린다
- stride가 1이면 이웃 출력의 수용 영역이 많이 겹치고, stride가 크면 적게 겹친다 → [[Stride]]

## 수식·원리
```
RF_l = RF_{l−1} + (k_l − 1) · J_{l−1},   J_l = J_{l−1} · s_l   (J: 입력 대비 누적 stride, J_0 = 1, RF_0 = 1)
3×3(s=1) 세 번: 1 → 3 → 5 → 7
```

## 코드 예시
```python
import torch
import torch.nn as nn

def rf(layers):                       # layers: [(kernel, stride), ...]
    r, j = 1, 1
    for k, s in layers:
        r, j = r + (k - 1) * j, j * s
    return r

print(rf([(3, 1)] * 3), rf([(7, 1)]))                  # 7 7    3x3 세 번 = 7x7 한 번
print(rf([(3, 1), (3, 1), (2, 2), (3, 1), (3, 1), (2, 2)]))   # 16  풀링 뒤 빨리 커짐
print(3 * 3 * 3, 7 * 7)                                # 27 49  가중치 수 비교

net = nn.Sequential(*[nn.Conv2d(1, 1, 3, bias=False) for _ in range(3)])
x = torch.zeros(1, 1, 15, 15, requires_grad=True)
net(x)[0, 0, 4, 4].backward()                          # 출력 한 픽셀의 기울기가 닿는 입력 범위
rows = (x.grad[0, 0].abs().sum(1) > 0).nonzero().flatten()
print(rows.min().item(), rows.max().item(), rows.numel())   # 4 10 7  → 7x7 영역
```

## 관련 개념
[[합성곱(Convolution)]] · [[Stride]] · [[VGG]] · [[풀링]] · [[Feature Map]]
