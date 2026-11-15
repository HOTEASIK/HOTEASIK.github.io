---
title: Volume Rendering
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, NeRF, 볼륨렌더링, AI응용]
---
# Volume Rendering

## 정의·핵심
- **정의 (응용 9차시)**: NeRF는 물체를 단단한 표면이 아닌 **밀도와 색상을 가진 구름(Volume)** 처럼 다룸 — 광선을 따라 **밀도와 색을 적분**해 픽셀 색을 얻음
  - **공간의 정의**: 3D 공간의 모든 점은 **밀도 σ**와 **방사 복사도 c(색상)** 를 가짐 — 빈 공간은 σ ≈ 0, 물체가 있는 곳은 높음
  - **광선 적분**: 픽셀로 쏜 광선을 따라 여러 점을 샘플링(Ray Marching)하고, 각 점의 불투명도와 색을 **누적**
- **이산화된 렌더링 식 (강의)**: **C(r) = Σ T_i · (1 − exp(−σ_i δ_i)) · c_i**
  - **C(r)**: 광선 r을 따라 렌더링된 **최종 픽셀 색상**
  - **T_i 누적 투과도 (Transmittance)**: **이전 구간까지 빛이 차단되지 않고 도달할 확률** — 앞에 진한 물체가 있으면 뒤는 안 보임(가려짐)
  - **σ_i 부피 밀도**: 해당 점에 **입자가 존재할 확률** (불투명도)
  - **α_i = 1 − exp(−σ_i δ_i)**: i번째 구간의 **불투명도** (δ_i = 샘플 간격)
  - 9차시 핵심이론: 색상 기여도 = **"T·α·c"** (투과도 × 불투명도 × 색)
- **배타적 누적곱 (Tiny NeRF 노트)**: 투과율 T_i는 빛이 지나가는 순서대로 **자기 자신을 포함하지 않는** 누적곱 (exclusive cumprod) → `T_1 = 1`
- **미분 가능성 (강의)**: 모든 연산이 미분 가능 → 렌더링 이미지와 실제 이미지의 **Loss를 역전파**해 신경망 학습 = "미분 가능 렌더링"
- **장점**: 연기·반투명·털 등 메시로 표현하기 어려운 디테일, 시점에 따른 빛 반사 / **단점**: 픽셀 하나에 **수백 번의 신경망 연산** → 느림, 실시간 어려움
- **부산물**: 같은 가중치 w_i = T_i α_i 로 **깊이 맵** `Σ w_i t_i`, **불투명도 맵** `Σ w_i` 도 계산
- **샘플링 (과제 문항 5)**: 학습 시엔 균일 간격에 **무작위 노이즈**(stratified sampling) → 공간을 고루 학습, 오버피팅 방지

## 수식·원리
```
연속:  C(r) = ∫_{t_n}^{t_f} T(t) σ(r(t)) c(r(t), d) dt,   T(t) = exp(−∫_{t_n}^{t} σ(r(s)) ds)
이산:  α_i = 1 − exp(−σ_i δ_i),    T_i = Π_{j<i} (1 − α_j) = exp(−Σ_{j<i} σ_j δ_j)
       w_i = T_i α_i,   Ĉ = Σ w_i c_i,   깊이 = Σ w_i t_i,   Σ w_i ≤ 1
```

## 코드 예시
```python
import torch

def volume_render(sigma, rgb, z_vals):
    delta = torch.cat([z_vals[..., 1:] - z_vals[..., :-1], torch.full_like(z_vals[..., :1], 1e10)], -1)
    alpha = 1.0 - torch.exp(-sigma * delta)                          # 불투명도
    T = torch.cumprod(torch.cat([torch.ones_like(alpha[..., :1]), 1.0 - alpha + 1e-10], -1), -1)[..., :-1]   # 배타적 누적곱
    w = T * alpha
    return (w[..., None] * rgb).sum(-2), (w * z_vals).sum(-1), w

z = torch.linspace(2.0, 6.0, 64)
sigma = torch.zeros(64); rgb = torch.zeros(64, 3)
sigma[30:34] = 50.0; rgb[30:34] = torch.tensor([1.0, 0.0, 0.0])    # z≈4에 진한 빨간 물체
sigma[45:50] = 50.0; rgb[45:50] = torch.tensor([0.0, 0.0, 1.0])    # 뒤에 파란 물체
color, depth, w = volume_render(sigma, rgb, z)
print([round(c, 3) for c in color.tolist()], round(depth.item(), 2))   # [1.0, 0.0, 0.0] 3.91  앞 물체만 보임(가려짐), 깊이 ≈ 4
print(round(w.sum().item(), 3))                                   # 1.0  광선이 완전히 막힘

sigma2 = sigma.clone(); sigma2[30:34] = 0.5                        # 앞 물체를 반투명하게
color2, _, _ = volume_render(sigma2, rgb, z)
print([round(c, 2) for c in color2.tolist()])                     # 빨강 일부 + 뒤의 파랑이 비침

s = sigma2.clone().requires_grad_(True)                            # 미분 가능 → 역전파로 학습
c, _, _ = volume_render(s, rgb, z)
((c - torch.tensor([0.0, 0.0, 1.0])) ** 2).sum().backward()
print(s.grad[30:34].mean().item() > 0)                             # True  "파랗게 보이려면 앞 물체 밀도를 줄여라"
```

## 관련 개념
[[NeRF]] · [[Ray Casting]] · [[Tiny NeRF 구현]] · [[Plenoptic Function]] · [[Gaussian Splatting]]
