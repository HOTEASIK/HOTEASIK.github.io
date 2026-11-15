---
title: BCEWithLogitsLoss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 이진분류, AI개론]
---
# BCEWithLogitsLoss

## 정의·핵심
- **정의**: **Sigmoid + BCE를 하나로 합친** 손실함수. 모델의 **로짓(Sigmoid 전 값)** 을 그대로 받는다. "안정적인 BCE" (개론 6차시) — 이진분류의 **실전 표준**
- **왜 합치나 — 수치 안정성**
  - 따로 하면: 로짓이 크게 음수(−200)면 `sigmoid → 0.0`으로 반올림 → `log(0) = −inf` → BCELoss는 −100으로 잘라 **기울기가 사라진다**
  - 합치면: `log(σ(z))`를 수식으로 정리해 **log-sum-exp 트릭**으로 계산 → 어떤 로짓에서도 정확한 값과 기울기 → [[log-sum-exp trick]]
- **사용법**
  - 모델 출력층에 **Sigmoid를 넣지 않는다** (넣으면 두 번 적용됨)
  - `criterion = nn.BCEWithLogitsLoss()`, `loss = criterion(logits, labels.float())` — 정답은 **float**, 모양 일치(`(N,1)`이면 정답도 `(N,1)`)
  - 예측 확률·라벨이 필요할 때: `prob = torch.sigmoid(logits)`, `pred = (prob > 0.5)` (= `logits > 0`)
- **`pos_weight`**: 양성 클래스 손실에 가중치 → 불균형 데이터 대응. 보통 `음성 수 / 양성 수` (예: 사기 거래 탐지) → [[Weighted Cross Entropy]]
- 강의 실습: 6차시 "MSE vs BCEWithLogits 비교와 Label Smoothing", 8차시 이진분류

## 수식·원리
```
ℓ(z, y) = −[y·log σ(z) + (1−y)·log(1−σ(z))]
        = max(z, 0) − z·y + log(1 + e^(−|z|))         ← 안정 버전 (overflow 없음)
pos_weight w:  −[w·y·log σ(z) + (1−y)·log(1−σ(z))]
```

## 코드 예시
```python
import torch
import torch.nn as nn

z = torch.tensor([-200.0, 0.0, 3.0]); y = torch.tensor([1.0, 1.0, 0.0])
sep = nn.BCELoss(reduction="none")(torch.sigmoid(z), y)
fused = nn.BCEWithLogitsLoss(reduction="none")(z, y)
print([round(v, 3) for v in sep.tolist()])      # [100.0, 0.693, 3.049]  ← 첫 값 잘림
print([round(v, 3) for v in fused.tolist()])    # [200.0, 0.693, 3.049]  ← 정확

zz = torch.tensor([-200.0], requires_grad=True)
nn.BCEWithLogitsLoss()(zz, torch.tensor([1.0])).backward()
print(zz.grad.item())                            # -1.0  기울기 살아 있음

pw = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([9.0]))(torch.tensor([0.0]), torch.tensor([1.0]))
print(round(pw.item(), 3))                       # 6.238 = 9 × 0.693
```

## 관련 개념
[[BCE(BCELoss)]] · [[Sigmoid]] · [[로짓(Logit)]] · [[log-sum-exp trick]] · [[Weighted Cross Entropy]] · [[CrossEntropyLoss]]
