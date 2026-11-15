---
title: Plenoptic Function
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, NeRF, 광학, AI응용]
---
# Plenoptic Function

## 정의·핵심
- **정의 (응용 9차시)**: "**완벽한 빛의 지도**" — 세상의 **모든 시점**에서 보이는 빛의 정보(색상, 세기)를 **하나의 거대한 함수**로 정의한 것 (Adelson & Bergen, 1991)
- **7개 변수 (강의)**
  - **어디서 보는가?** (x, y, z) — 3차원 위치 (V_x, V_y, V_z)
  - **어떤 방향인가?** (θ, φ) — 시선 각도 (방위각, 고도각)
  - **어떤 색인가?** (λ) — 빛의 파장
  - **언제 보는가?** (t) — 시간
  - `IPF = P(θ, φ, λ, t, V_x, V_y, V_z)`
- **의미 (강의)**: 눈(카메라)으로 장면을 볼 때 ① 어떤 위치에서 ② 어떤 방향으로 ③ 어떤 파장의 빛이 어느 세기로 오는지 알 수 있다면 → **어떤 각도에서든(입력에 없는 각도라도)** 그 물체를 본 모습을 상상할 수 있음
- **NeRF의 단순화: 7D → 5D (강의)**
  - `Rad = P(x, y, z, θ, φ, λ, t)` → `(c, σ) = F_Θ(x, y, z, θ, φ)`
  - **λ 제거**: 파장 대신 **RGB 3채널**로 색을 출력
  - **t 제거**: **정적 장면 가정 (Static Scene Assumption)** — 촬영하는 동안 장면이 변하지 않음
  - 추가로 **밀도 σ** 를 출력해 볼륨 렌더링 가능하게 → [[NeRF]], [[Volume Rendering]]
- **관점 차이 (강의)**
  - **Plenoptic Function**: **관찰자(눈, 카메라)가 중심** — 외부에서 들어오는 모든 광선을 설명
  - **NeRF**: **장면(물체)이 중심** — 장면으로부터 **나가는 빛의 세기**를 학습

## 수식·원리
```
Plenoptic (7D):   L = P(x, y, z, θ, φ, λ, t)
NeRF (5D):        (c, σ) = F_Θ(x, y, z, θ, φ),    c = (r, g, b)
방향 (θ, φ) → 단위 벡터:  d = (sin θ cos φ, sin θ sin φ, cos θ)
```

## 코드 예시
```python
import numpy as np

def plenoptic_scene(x, y, z, theta, phi, lam=None, t=None):   # 정적 장면: λ, t는 무시 (5D로 충분)
    d = np.array([np.sin(theta) * np.cos(phi), np.sin(theta) * np.sin(phi), np.cos(theta)])
    inside = x ** 2 + y ** 2 + z ** 2 < 1                      # 단위 구 = 물체
    sigma = 10.0 if inside else 0.0                            # 밀도 (물체 존재)
    base = np.array([0.8, 0.2, 0.2])                           # 빨간 물체
    spec = 0.2 * max(0.0, float(d @ np.array([0, 0, 1.0]))) ** 8   # 보는 방향에 따른 반사광 (view-dependent)
    return np.clip(base + spec, 0, 1), sigma

c1, s1 = plenoptic_scene(0.2, 0, 0, 0.0, 0.0)                 # 같은 점을 정면(θ=0)에서
c2, s2 = plenoptic_scene(0.2, 0, 0, np.pi / 2, 0.0)           # 옆(θ=90°)에서
print(c1.round(2).tolist(), c2.round(2).tolist(), s1)         # [1.0, 0.4, 0.4] [0.8, 0.2, 0.2] 10.0  방향 따라 색이 다름
print(plenoptic_scene(2, 0, 0, 0, 0)[1])                       # 0.0  빈 공간은 밀도 0

c3, _ = plenoptic_scene(0.2, 0, 0, 0.0, 0.0, lam=550e-9, t=5.0)
print(np.allclose(c1, c3))                                     # True  정적 장면 가정: 시간·파장이 바뀌어도 같음 → 7D → 5D
```

## 관련 개념
[[NeRF]] · [[Volume Rendering]] · [[가상 카메라]] · [[Ray Casting]]
