---
title: Orthogonal 초기화
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 가중치초기화]
---
# Orthogonal 초기화

## 정의·핵심
- **정의**: 가중치 행렬을 **직교 행렬**(행·열 벡터가 서로 수직이고 길이 1, `WᵀW = I`)로 초기화하는 방법. `nn.init.orthogonal_(w, gain=1)`
- **핵심 성질 — 길이 보존**: 직교 행렬은 벡터를 **회전만 시키고 크기는 바꾸지 않는다** (모든 특이값이 1) → 같은 행렬을 여러 번 곱해도 신호가 커지거나 작아지지 않는다
- **어디에 좋은가 — RNN**: RNN은 같은 은닉 가중치 `W_hh`를 **시간 단계마다 반복해서 곱한다**. 특이값이 1보다 크면 폭주, 작으면 소실 → 직교 초기화로 시작하면 긴 시퀀스에서도 기울기가 잘 유지된다 → [[RNN]], [[LSTM]]
- **그 밖의 사용**: 강화학습 정책 네트워크(PPO 구현의 관례: 은닉층 gain=√2, 출력층 gain=0.01), 아주 깊은 선형·Tanh 망
- **구현 원리**: 정규분포로 무작위 행렬을 만든 뒤 **QR 분해**해서 Q(직교 행렬)를 쓴다
- 행렬이 정사각형이 아니면 작은 쪽 차원에 대해서만 직교(반직교)

## 수식·원리
```
WᵀW = I   →   ‖Wx‖ = ‖x‖,  모든 특이값 = 1
Wⁿx 도 ‖x‖ 유지  → 반복 곱(RNN)에서 소실·폭주 방지
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
W = torch.empty(64, 64); nn.init.orthogonal_(W)
print(torch.allclose(W.T @ W, torch.eye(64), atol=1e-5))         # True
x = torch.randn(64)
h = x.clone()
for _ in range(100):
    h = W @ h                                                    # 100번 반복해도
print(round((h.norm() / x.norm()).item(), 3))                    # 1.0  크기 그대로

R = torch.randn(64, 64) / 8 * 1.1                                # 일반 무작위(약간 큰 스케일)
g = x.clone()
for _ in range(100):
    g = R @ g
print((g.norm() / x.norm()).item() > 10)                          # True  ← 폭주
```

## 관련 개념
[[Xavier(Glorot) 초기화]] · [[He(Kaiming) 초기화]] · [[RNN]] · [[기울기 폭주(Exploding Gradient)]] · [[nn.init]]
