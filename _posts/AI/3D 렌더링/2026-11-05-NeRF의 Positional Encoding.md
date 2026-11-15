---
title: NeRF의 Positional Encoding
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, NeRF, 위치인코딩, AI응용]
---
# NeRF의 Positional Encoding

## 정의·핵심
- **정의 (응용 9차시)**: 단순 좌표 (x, y, z)를 **고차원 주파수 데이터로 변환**해, MLP가 **고주파 디테일(선명한 텍스처)** 을 학습할 수 있게 돕는 기법
  - 좌표 p → `γ(p) = (p, sin(2⁰πp), cos(2⁰πp), …, sin(2^{L−1}πp), cos(2^{L−1}πp))`
- **왜 필요한가**: MLP는 입력에 대해 **부드러운(저주파) 함수를 먼저 학습**하는 경향(spectral bias) → 좌표를 그대로 넣으면 결과가 **흐릿함** → 미리 고주파 sin/cos로 펼쳐 주면 날카로운 경계·텍스처 표현 가능
- **차원 (9차시 핵심이론, Tiny NeRF)**
  - **L_embed = 10** → (x, y, z) **3차원을 63차원으로** 확장: 3 + 3 × 2 × 10 = 63
  - 원 논문: 위치 L = 10, 방향 L = 4 (3 + 3×2×4 = 27차원)
- **파이프라인 (강의)**: Position x, Direction d → **γ(p) Positional Encoding** → MLP → RGB c, Density σ
- **Transformer 위치 인코딩과의 차이**: 둘 다 sin/cos 주파수를 쓰지만, Transformer는 **토큰 순서(정수 위치)** 표현용, NeRF는 **연속 좌표의 고주파 표현**용 (Fourier features) → [[Positional Encoding]]
- **트레이드오프**: L이 너무 작으면 흐림, 너무 크면 노이즈·과적합 / 후속 연구: Instant-NGP의 **해시 인코딩**(학습 속도 대폭 향상)

## 수식·원리
```
γ(p) = [ p,  sin(2^0 π p), cos(2^0 π p),  …,  sin(2^{L−1} π p), cos(2^{L−1} π p) ]
출력 차원 = D + D × 2 × L      (D = 3, L = 10 → 63)
가장 높은 주파수의 주기 = 2 / 2^{L−1}   (L = 10 → 약 0.004)
```

## 코드 예시
```python
import torch
import torch.nn as nn

def posenc(x, L_embed=10):                                # Tiny NeRF 방식 (π 없이 2^k 사용)
    rets = [x]
    for i in range(L_embed):
        for fn in (torch.sin, torch.cos):
            rets.append(fn(2.0 ** i * x))
    return torch.cat(rets, -1)

print(tuple(posenc(torch.rand(5, 3)).shape))              # (5, 63)  3차원 → 63차원

torch.manual_seed(0)                                      # 1D 고주파 신호 맞추기: PE 유무 비교
x = torch.linspace(-1, 1, 256)[:, None]
y = torch.sign(torch.sin(12 * x))                         # 날카로운 경계가 있는 신호
def fit(use_pe):
    in_dim = posenc(x, 6).shape[-1] if use_pe else 1
    net = nn.Sequential(nn.Linear(in_dim, 64), nn.ReLU(), nn.Linear(64, 64), nn.ReLU(), nn.Linear(64, 1))
    opt = torch.optim.Adam(net.parameters(), lr=1e-2)
    inp = posenc(x, 6) if use_pe else x
    for _ in range(500):
        loss = ((net(inp) - y) ** 2).mean(); opt.zero_grad(); loss.backward(); opt.step()
    return loss.item()

no_pe, with_pe = fit(False), fit(True)
print(with_pe < no_pe, with_pe < 0.1)                      # True True  PE가 있어야 고주파(날카로운 경계)를 학습
```

## 관련 개념
[[NeRF]] · [[Tiny NeRF 구현]] · [[Positional Encoding]] · [[Volume Rendering]]
