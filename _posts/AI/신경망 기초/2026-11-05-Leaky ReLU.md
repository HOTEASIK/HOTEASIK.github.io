---
title: Leaky ReLU
date: 2026-11-05 12:00:00 +0900
categories: [AI, 신경망 기초]
tags: [신경망기초, 활성화함수, AI개론]
---
# Leaky ReLU

## 정의·핵심
- **정의**: 음수 입력에서 0 대신 **작은 기울기 α를 곱한 값**을 내보내는 ReLU. "음수도 살짝 흘려 '죽은 뉴런'을 완화" (강의 표)
- **해결하는 문제 — Dying ReLU**: ReLU는 음수 영역 기울기가 0이라 한 번 계속 음수가 된 뉴런은 영영 학습되지 않는다. Leaky ReLU는 음수에서도 기울기 **α(예: 0.01)** 가 있어 뉴런이 되살아날 수 있다
- **α 값**: `nn.LeakyReLU(negative_slope=0.01)` 기본 0.01. GAN 판별기·YOLO(v3 등)에서는 **0.1~0.2**를 자주 쓴다. α는 **튜닝이 필요한 하이퍼파라미터** (강의: "α 튜닝 필요")
- **범위**: (−∞, ∞), 도함수는 α 또는 1
- **변형**
  - **PReLU**: α를 **학습되는 파라미터**로 (`nn.PReLU()`)
  - **ELU**: 음수에서 `α(e^z − 1)`로 부드럽게 → 출력 평균이 0에 가까움
- **언제 쓰나**: ReLU로 학습할 때 죽은 뉴런 비율이 높을 때, GAN 판별기(기울기가 생성기까지 잘 흐르도록)

## 수식·원리
```
LeakyReLU(z) = z (z ≥ 0),  αz (z < 0)
도함수        = 1 (z > 0),  α  (z < 0)
```

## 코드 예시
```python
import torch
import torch.nn as nn

z = torch.tensor([-10.0, -1.0, 0.0, 2.0], requires_grad=True)
f = nn.LeakyReLU(negative_slope=0.1)
y = f(z)
y.sum().backward()
print([round(v, 2) for v in y.tolist()])            # [-1.0, -0.1, 0.0, 2.0]
print([round(g, 2) for g in z.grad.tolist()])       # [0.1, 0.1, 0.1, 1.0]  ← 음수에도 기울기 (z=0은 α 쪽으로 처리)
print(sum(p.numel() for p in nn.PReLU().parameters()))   # 1  (학습되는 α)
```

## 관련 개념
[[ReLU]] · [[GELU]] · [[Mish]] · [[DCGAN]] · [[활성화 함수의 목적]]
