---
title: Content Loss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 스타일전이, 손실함수, AI응용]
---
# Content Loss

## 정의·핵심
- **정의**: 신경망 스타일 전이에서 생성 이미지가 **콘텐츠 이미지의 객체(Object)와 배치(Layout)** 를 유지하도록, 두 이미지의 **같은 층 특징 맵 차이(MSE)** 를 벌점으로 주는 손실 (응용 6차시 "콘텐츠 손실 함수")
- **목적 (강의)**: 입력 이미지의 **객체와 배치에 대한 자세한 특징**을 추출하는 것
- **왜 특징 맵을 비교하나**
  - **픽셀 MSE**를 쓰면 색·질감까지 똑같이 맞추려 해서 스타일이 들어갈 여지가 없음
  - CNN의 **깊은 층 특징**은 "무엇이 어디에 있는가"(고수준 구조)를 담고, 세부 픽셀 값은 덜 신경 씀 → 구조만 보존
  - 보통 **conv4_2**(VGG19) 한 층 사용 — 얕은 층을 쓰면 원본과 거의 똑같은 이미지(스타일 약함), 너무 깊으면 형태가 무너짐
- **시각화 방법 (강의)**: 각 층이 무엇을 인코딩하는지 보기 위해
  1. **흰색 노이즈 이미지(White Noise)** 에서 시작
  2. **경사하강법(Gradient Descent)** 으로 최적화
  3. 원본 이미지의 특징과 **일치하는 이미지를 탐색** (Feature Inversion)
  - 결과: 얕은 층으로 복원하면 원본과 거의 같고, 깊은 층으로 복원하면 **형태·배치는 남고 세부 픽셀 정보는 사라짐** → 콘텐츠 표현에 적합
- 이미지 변환 네트워크(Fast Style Transfer), 초해상도(SRGAN)에서는 같은 아이디어를 **Perceptual Loss(지각 손실)** 라 부름

## 수식·원리
```
L_content(p, x, l) = ½ Σ_{i,j} (F^l_ij − P^l_ij)²
F^l = 생성 이미지 x의 l층 특징 (N_l 채널 × M_l 위치)
P^l = 콘텐츠 이미지 p의 l층 특징
∂L/∂F^l_ij = (F^l − P^l)_ij   (F^l_ij > 0 일 때)
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ContentLoss(nn.Module):
    def __init__(self, target):
        super().__init__()
        self.target = target.detach()                    # 콘텐츠 특징은 상수
    def forward(self, x):
        self.loss = F.mse_loss(x, self.target)
        return x                                         # 특징은 그대로 다음 층으로 (모델 중간에 끼워 넣기)

torch.manual_seed(0)
enc = nn.Sequential(nn.Conv2d(3, 8, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2), nn.Conv2d(8, 16, 3, padding=1), nn.ReLU())
for p in enc.parameters(): p.requires_grad_(False)
content = torch.rand(1, 3, 32, 32)
cl = ContentLoss(enc(content))
x = torch.rand(1, 3, 32, 32, requires_grad=True)       # 흰 노이즈에서 시작 (강의 시각화 방법)
opt = torch.optim.Adam([x], lr=0.05)
for step in range(200):
    cl(enc(x)); opt.zero_grad(); cl.loss.backward(); opt.step()
    if step in (0, 199): print(step, round(cl.loss.item(), 5))   # 특징 차이 감소
pix = F.mse_loss(x.detach(), content).item()
print(round(pix, 4) > 0)                                 # True  특징은 맞췄지만 픽셀이 완전히 같지는 않음
```

## 관련 개념
[[신경망 스타일 전이(NST)]] · [[Style Loss]] · [[Gram Matrix]] · [[Feature Map]] · [[VGG]]
