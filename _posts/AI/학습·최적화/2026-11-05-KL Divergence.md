---
title: KL Divergence
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 확률, AI개론]
---
# KL Divergence

## 정의·핵심
- **정의**: Kullback-Leibler Divergence. 두 확률 분포 **P(정답·목표)와 Q(예측)가 얼마나 다른지** 재는 값. "P 대신 Q를 쓸 때 추가로 드는 정보량"
- **성질**
  - 항상 **0 이상**, 두 분포가 **같을 때만 0**
  - **비대칭**: `KL(P‖Q) ≠ KL(Q‖P)` → 거리(distance)가 아니라 "발산(divergence)"
- **Cross Entropy와의 관계**: `CE(P, Q) = H(P) + KL(P‖Q)`
  - 정답 P가 고정이면 엔트로피 H(P)는 상수 → **CE 최소화 = KL 최소화**
  - 정답이 원-핫이면 H(P) = 0 → CE와 KL이 **같은 값**
- **쓰이는 곳**
  - **VAE**: 잠재 분포 q(z|x)를 표준정규분포 N(0, I)에 가깝게 만드는 규제항 → [[VAE Loss]]
  - **지식 증류(Knowledge Distillation)**: 큰 모델(교사)의 soft 확률을 작은 모델(학생)이 따라 하도록
  - **Label Smoothing**: 부드러운 정답 분포와 예측 사이 → [[Label Smoothing]]
  - **강화학습 PPO·RLHF**: 새 정책이 이전 정책에서 너무 멀어지지 않게 제한 → [[PPO]]
- **PyTorch 주의 `nn.KLDivLoss`**
  - 입력(예측)은 **로그 확률**(`log_softmax`), 목표는 **확률**(기본) — 순서·형식 헷갈리기 쉬움
  - `reduction='batchmean'`을 써야 수학적 정의와 같다 (기본 `'mean'`은 원소 수로 나눠 값이 작아짐)

## 수식·원리
```
KL(P‖Q) = Σ P(x) · log(P(x) / Q(x))
CE(P,Q) = −Σ P log Q = H(P) + KL(P‖Q)
정규분포:  KL(N(μ,σ²) ‖ N(0,1)) = ½ Σ (μ² + σ² − log σ² − 1)
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

P = torch.tensor([[0.7, 0.2, 0.1]]); Q = torch.tensor([[0.5, 0.3, 0.2]])
kl = (P * (P / Q).log()).sum()
print(round(kl.item(), 4))                                                    # 0.0851
print(round(nn.KLDivLoss(reduction="batchmean")(Q.log(), P).item(), 4))      # 0.0851  입력=log Q, 목표=P
print(round((Q * (Q / P).log()).sum().item(), 4))                             # 0.0920  ← 비대칭

H = -(P * P.log()).sum(); CE = -(P * Q.log()).sum()
print(torch.allclose(CE, H + kl))                                             # True

mu, logvar = torch.tensor([0.0, 1.0]), torch.tensor([0.0, 0.0])
print((0.5 * (mu ** 2 + logvar.exp() - logvar - 1)).sum().item())             # 0.5  VAE KL항
```

## 관련 개념
[[CrossEntropyLoss]] · [[NLLLoss]] · [[VAE Loss]] · [[Label Smoothing]] · [[PPO]] · [[MLE(최대우도추정)]]
