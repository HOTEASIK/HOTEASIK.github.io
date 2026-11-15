---
title: Conditional GAN
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, GAN, 조건부생성, AI응용]
---
# Conditional GAN

## 정의·핵심
- **정의**: cGAN (Mirza & Osindero, 2014). G와 D 모두에 **조건 y**(클래스 레이블, 텍스트, 이미지 등)를 함께 입력해 **원하는 종류의 샘플**을 생성하는 GAN (응용 7차시 GAN 변형)
  - 일반 GAN: z만 입력 → 무엇이 나올지 **제어 불가**
  - cGAN: (z, y) 입력 → "숫자 7을 그려라"처럼 **조건부 분포 p(x|y)** 학습 → [[생성 모델 vs 판별 모델]]
- **조건 넣는 법**
  - G: `concat(z, onehot(y))` 또는 `concat(z, Embedding(y))`
  - D: `concat(x, y)` — 이미지면 y를 채널로 펼쳐 붙임, 또는 **Projection Discriminator**(특징과 y 임베딩의 내적)
  - D는 "진짜인가?"뿐 아니라 "**y와 맞는 진짜인가?**"를 판별 → 이미지는 진짜 같은데 조건과 안 맞으면 가짜로 판정
- **효과**: 원하는 클래스 생성, 클래스별 생성으로 **mode collapse 완화** → [[Mode Collapse]]
- **확장**
  - **Pix2Pix**: 조건 = **입력 이미지** (스케치 → 사진, 흑백 → 컬러) → [[Pix2Pix]]
  - **AC-GAN**: D가 진위 + **클래스 분류**를 함께 출력
  - 텍스트 조건: StackGAN, 이후 확산 모델(텍스트 → 이미지)로 발전

## 수식·원리
```
min_G max_D  E_{x,y}[log D(x | y)] + E_{z,y}[log(1 − D(G(z | y) | y))]
G 입력: [z ; onehot(y)]     D 입력: [x ; onehot(y)]
```

## 코드 예시
```python
import torch
import torch.nn as nn

class CondG(nn.Module):
    def __init__(self, nz=16, n_cls=10, out=28 * 28):
        super().__init__()
        self.emb = nn.Embedding(n_cls, n_cls)
        self.net = nn.Sequential(nn.Linear(nz + n_cls, 128), nn.ReLU(), nn.Linear(128, out), nn.Tanh())
    def forward(self, z, y): return self.net(torch.cat([z, self.emb(y)], 1))

class CondD(nn.Module):
    def __init__(self, n_cls=10, inp=28 * 28):
        super().__init__()
        self.emb = nn.Embedding(n_cls, n_cls)
        self.net = nn.Sequential(nn.Linear(inp + n_cls, 128), nn.LeakyReLU(0.2), nn.Linear(128, 1), nn.Sigmoid())
    def forward(self, x, y): return self.net(torch.cat([x, self.emb(y)], 1))

torch.manual_seed(0)
G, D = CondG(), CondD()
z = torch.randn(3, 16)
y = torch.tensor([7, 7, 3])                      # "7, 7, 3을 그려라"
x = G(z, y)
print(tuple(x.shape), tuple(D(x, y).shape))      # (3, 784) (3, 1)
same_z = torch.randn(1, 16).repeat(2, 1)
a = G(same_z, torch.tensor([0, 1]))
print(torch.allclose(a[0], a[1]))                # False  같은 z라도 조건이 다르면 다른 출력
```

## 관련 개념
[[GAN]] · [[Pix2Pix]] · [[Mode Collapse]] · [[임베딩]] · [[생성 모델 vs 판별 모델]]
