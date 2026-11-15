---
title: Loss Surface
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, AI개론]
---
# Loss Surface

## 정의·핵심
- **정의**: 손실 곡면. **가중치 공간에서 손실값의 변화를 나타낸 지형**. 산악 지형처럼 높낮이가 있고, 학습의 목표는 **가장 낮은 계곡**을 찾는 것 (개론 6차시 "가중치 공간의 지형도")
  - 가중치가 2개면 3D 지형으로 그릴 수 있지만, 실제 모델은 수백만 차원 → 무작위 두 방향으로 잘라 단면을 시각화한다
- **나쁜 지형**: 울퉁불퉁(국소 최솟값·안장점 많음), 좁고 가파른 협곡(진동), 평평한 고원(학습 정체), 절벽(기울기 폭주)
- **좋은 지형**: 매끄럽고 **넓고 평평한 최솟값(flat minimum)** — 가중치가 조금 달라져도 손실이 비슷해서 **일반화가 잘 된다**. 날카로운 최솟값(sharp minimum)은 훈련 데이터에만 맞는 경향
- **좋은 손실 곡면 만드는 방법 (강의)**
  - **BatchNorm 사용**: 내부 공변량 이동 감소 → [[Batch Normalization]]
  - **Skip Connection**: 깊은 네트워크도 부드럽게 (ResNet 유무에 따른 지형 차이가 유명) → [[Residual Block]]
  - **적절한 초기화**: He/Xavier → [[He(Kaiming) 초기화]]
  - **작은 배치 크기**: 넓은 최소값 발견 → [[미니배치·배치 크기]]
- **학습 안정성 확보 (강의)**
  - 그래디언트 클리핑: 폭발 방지 → [[기울기 폭주(Exploding Gradient)]]
  - Warm-up: 초반 안전한 탐색 → [[Warm-up]]
  - 적절한 학습률: 진동 방지 → [[학습률]]
  - 손실값 모니터링: 이상 징후 조기 발견 → [[학습 곡선]]

## 수식·원리
```
L(θ) : ℝᵈ → ℝ    (d = 파라미터 수)
시각화: L(θ* + α·δ₁ + β·δ₂),  δ₁, δ₂ = 무작위 방향
곡률(Hessian 고윳값)이 작을수록 평평한 최솟값
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
X = torch.randn(100, 2); y = X @ torch.tensor([2.0, -1.0])
a = torch.linspace(-1, 5, 61); b = torch.linspace(-4, 2, 61)
A, B = torch.meshgrid(a, b, indexing="ij")
W = torch.stack([A, B], -1)                               # (61, 61, 2) 가중치 격자
L = ((X @ W.reshape(-1, 2).T - y[:, None]) ** 2).mean(0).reshape(61, 61)   # 지형 계산
i, j = divmod(L.argmin().item(), 61)
print(round(a[i].item(), 1), round(b[j].item(), 1), round(L.min().item(), 3))   # 2.0 -1.0 0.0
# plt.contour(A, B, L, levels=30) 로 등고선 지형을 그릴 수 있다
```

## 관련 개념
[[경사하강법(GD)]] · [[국소 최솟값(Local Minimum)]] · [[Batch Normalization]] · [[Residual Block]] · [[Warm-up]]
