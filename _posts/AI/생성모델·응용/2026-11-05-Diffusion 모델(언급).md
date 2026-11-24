---
title: Diffusion 모델
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 확산모델, AI응용]
---
# Diffusion 모델

## 정의·핵심
- **정의**: 데이터에 **노이즈를 조금씩 더해 완전한 노이즈로 만드는 과정(Forward)** 을 정해 두고, 그 **반대로 노이즈를 조금씩 걷어내는 과정(Reverse)** 을 신경망으로 학습하는 생성 모델 (DDPM, Ho et al. 2020). 보충 생성형 AI 2주차 분류에서 **잠재변수 활용·명시적 확률 모델**로 언급
- **Forward(확산) 과정**: 학습 없음, 고정된 스케줄 β_t로 `x_0 → x_1 → … → x_T ≈ N(0, I)`
  - 임의 시점으로 한 번에 점프 가능: `x_t = √ᾱ_t·x_0 + √(1 − ᾱ_t)·ε` (Reparameterization과 같은 형태) → [[Reparameterization Trick]]
- **Reverse(생성) 과정**: 신경망 ε_θ(x_t, t)가 **x_t에 섞인 노이즈 ε를 예측** → 조금씩 빼면서 `x_T → x_0`
  - 노이즈 예측 네트워크로 주로 **U-Net**(입출력 크기 동일, 시점 t 임베딩 추가) → [[U-Net]]
- **학습 손실**: ELBO에서 유도되지만 실무에선 단순한 **`‖ε − ε_θ(x_t, t)‖²` (MSE)** → [[ELBO]]
- **특징**
  - GAN보다 **학습 안정적**, VAE보다 **선명**, 다양성도 좋음 → [[GAN vs VAE]]
  - 단점: 수십~수천 스텝 반복 → **생성이 느림** → DDIM, 잠재 공간 확산 등으로 개선
- **응용**: **Stable Diffusion**(VAE 잠재 공간에서 확산 + 텍스트 조건), DALL·E 2/3, Imagen, 이미지 편집·인페인팅, 동영상 생성
- **조건부 생성**: 텍스트 임베딩을 cross-attention으로 주입, **Classifier-Free Guidance**로 조건 강도 조절

## 수식·원리
```
q(x_t | x_{t−1}) = N(√(1−β_t)·x_{t−1}, β_t·I)
ᾱ_t = Π_{s≤t} (1 − β_s)
x_t = √ᾱ_t·x_0 + √(1−ᾱ_t)·ε,   ε ~ N(0, I)
L_simple = E_{t, x_0, ε} ‖ε − ε_θ(x_t, t)‖²
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
T = 1000
beta = torch.linspace(1e-4, 0.02, T)
alpha_bar = torch.cumprod(1 - beta, 0)

x0 = torch.ones(10000) * 2.0                                  # 데이터 (전부 값 2)
for t in (0, 250, 999):
    eps = torch.randn_like(x0)
    xt = alpha_bar[t].sqrt() * x0 + (1 - alpha_bar[t]).sqrt() * eps    # 한 번에 t 시점으로
    print(t, round(xt.mean().item(), 2), round(xt.std().item(), 2))    # 갈수록 평균 0, 표준편차 1 (순수 노이즈)

t = 500
eps = torch.randn_like(x0)
xt = alpha_bar[t].sqrt() * x0 + (1 - alpha_bar[t]).sqrt() * eps
x0_hat = (xt - (1 - alpha_bar[t]).sqrt() * eps) / alpha_bar[t].sqrt()  # 노이즈를 정확히 예측했다면
print(torch.allclose(x0_hat, x0, atol=1e-3))                  # True  원본 복원 → 그래서 ε를 예측하도록 학습
```

## 관련 개념
[[U-Net]] · [[ELBO]] · [[Reparameterization Trick]] · [[GAN vs VAE]] · [[VAE]]
