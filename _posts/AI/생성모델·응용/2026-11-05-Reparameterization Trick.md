---
title: Reparameterization Trick
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, VAE, 역전파, AI응용]
---
# Reparameterization Trick

## 정의·핵심
- **정의**: 확률 분포에서 **샘플링하는 연산을 미분 가능하게** 바꾸는 기법 — `z ~ N(μ, σ²)` 를 **`z = μ + σ·ε, ε ~ N(0, 1)`** 로 다시 쓰는 것 (응용 7차시, 과제 문항 2)
- **문제**: VAE 인코더가 μ, σ를 내고 그 분포에서 z를 **무작위로 뽑으면**, "뽑기"는 미분할 수 없는 연산 → 디코더 손실의 기울기가 **μ, σ(인코더)까지 전달되지 않음** → 인코더 학습 불가
- **해결**
  - 무작위성을 **외부 노이즈 ε** 로 분리 (ε는 파라미터와 무관한 상수 취급)
  - z는 μ, σ에 대한 **결정적 함수** `z = μ + σ·ε` → `∂z/∂μ = 1`, `∂z/∂σ = ε` → 역전파 가능
  - 분포는 그대로: `μ + σ·ε ~ N(μ, σ²)`
- **구현 관례**: 인코더가 σ 대신 **log σ²(logvar)** 를 출력 → 항상 양수인 σ = `exp(0.5·logvar)`, 수치 안정
- **추론 시**: 생성할 때는 `z ~ N(0, I)`에서 바로 뽑아 디코더에 넣음, 재구성만 할 때는 z = μ를 쓰기도 함
- **다른 쓰임**: 확산 모델의 `x_t = √ᾱ·x_0 + √(1−ᾱ)·ε`, 이산 분포용 **Gumbel-Softmax**, 강화학습 SAC의 정책 샘플링

## 수식·원리
```
z ~ N(μ, σ²)         → 샘플링에 기울기 없음
z = μ + σ ⊙ ε,  ε ~ N(0, I)
∂z/∂μ = 1,   ∂z/∂σ = ε,   σ = exp(½·logvar)
∇_φ E_{q_φ}[f(z)] = E_ε[ ∇_φ f(μ_φ + σ_φ ε) ]
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
mu = torch.tensor([1.0], requires_grad=True)
logvar = torch.tensor([0.0], requires_grad=True)

z_bad = torch.normal(mu.detach(), torch.exp(0.5 * logvar.detach()))   # 그냥 샘플링
print(z_bad.requires_grad)                                    # False  인코더로 기울기 안 감

eps = torch.randn(1)
z = mu + torch.exp(0.5 * logvar) * eps                       # reparameterization
(z ** 2).backward()
print(round(mu.grad.item(), 3) == round(2 * z.item(), 3))    # True  ∂z/∂μ = 1 → 기울기 2z
print(round(logvar.grad.item(), 3) == round(2 * z.item() * eps.item() * 0.5, 3))   # True  σ=1일 때 ∂z/∂logvar = ½σε

samples = 3.0 + 2.0 * torch.randn(100000)                    # μ=3, σ=2
print(round(samples.mean().item(), 1), round(samples.std().item(), 1))   # 3.0 2.0  분포는 그대로
```

## 관련 개념
[[VAE]] · [[ELBO]] · [[VAE Loss]] · [[역전파(Backpropagation)]] · [[Diffusion 모델(언급)]]
