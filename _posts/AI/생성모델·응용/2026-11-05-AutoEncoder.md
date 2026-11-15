---
title: AutoEncoder
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 오토인코더, 비지도학습, AI응용]
---
# AutoEncoder

## 정의·핵심
- **정의**: 입력 x를 **저차원 잠재 벡터 z로 압축(Encoder)** 했다가 다시 **x̂로 복원(Decoder)** 하도록 학습하는 신경망. 정답 레이블 없이 **입력 자체가 정답** → 비지도(자기지도) 학습
- **구조**
  - **Encoder** `z = f(x)`: 차원 축소, 핵심 특징만 남김
  - **Bottleneck(잠재 공간)**: 입력보다 작은 차원 → 그대로 복사하지 못하게 강제
  - **Decoder** `x̂ = g(z)`: 잠재 벡터에서 원래 데이터 복원
  - **손실**: 재구성 오차 `‖x − x̂‖²` (MSE) 또는 BCE(픽셀이 0~1일 때)
- **쓰임**
  - **차원 축소·특징 추출** (비선형 PCA)
  - **노이즈 제거 (Denoising AE)**: 노이즈 입력 → 깨끗한 원본 복원 학습
  - **이상 탐지**: 정상 데이터로만 학습 → 비정상 입력은 **재구성 오차가 큼**
  - 사전학습, 데이터 압축
- **생성 모델로서의 한계 → VAE로 발전**
  - 일반 AE의 잠재 공간은 **불규칙**(학습 데이터 점들만 의미 있고 그 사이는 빈 공간)
  - 임의의 z를 뽑아 디코더에 넣으면 **의미 없는 이미지**가 나옴 → 샘플링 불가
  - **VAE**: z를 하나의 점이 아니라 **확률 분포 N(μ, σ²)** 로 인코딩하고, 이 분포를 N(0, I)에 가깝게 정규화(KL) → 연속적이고 샘플링 가능한 잠재 공간 → [[VAE]]

## 수식·원리
```
z = f_φ(x),   x̂ = g_θ(z)
L(φ, θ) = (1/n) Σ ‖x_i − g_θ(f_φ(x_i))‖²
이상 점수 = ‖x − x̂‖²   (클수록 이상)
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
basis = torch.randn(2, 20)
normal = torch.randn(512, 2) @ basis                    # 실제로는 2차원 구조를 가진 20차원 데이터
ae = nn.Sequential(nn.Linear(20, 8), nn.ReLU(), nn.Linear(8, 2),   # Encoder → z (2차원)
                   nn.Linear(2, 8), nn.ReLU(), nn.Linear(8, 20))   # Decoder
opt = torch.optim.Adam(ae.parameters(), lr=1e-2)
for epoch in range(500):
    loss = ((ae(normal) - normal) ** 2).mean()
    opt.zero_grad(); loss.backward(); opt.step()
print(round(loss.item(), 3) < 0.5)                      # True  2차원 병목으로도 복원됨

with torch.no_grad():
    err_n = ((ae(normal) - normal) ** 2).mean(1).mean().item()
    odd = torch.randn(64, 20) * 2                       # 구조를 따르지 않는 이상 데이터
    err_a = ((ae(odd) - odd) ** 2).mean(1).mean().item()
print(err_a > err_n * 3)                                # True  이상 데이터는 재구성 오차가 큼
```

## 관련 개념
[[VAE]] · [[VAE Loss]] · [[U-Net]] · [[GAN vs VAE]]
