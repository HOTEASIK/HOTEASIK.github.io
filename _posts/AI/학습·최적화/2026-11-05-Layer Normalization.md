---
title: Layer Normalization
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 정규화층, Transformer]
---
# Layer Normalization

## 정의·핵심
- **정의**: **샘플 하나 안에서** 특징 차원 전체의 평균·분산으로 정규화하는 층. `nn.LayerNorm(normalized_shape)` — 보통 마지막 차원(임베딩 크기 d_model)
- **BatchNorm과 차이**

| | BatchNorm | LayerNorm |
|---|---|---|
| 통계를 구하는 방향 | **배치 방향** (같은 채널, 여러 샘플) | **특징 방향** (한 샘플, 여러 특징) |
| 배치 크기 영향 | 작으면 불안정 | **없음** (배치 1도 OK) |
| train/eval 차이 | 있음 (running 통계) | **없음** (항상 같은 계산) |
| 주 사용처 | CNN | **Transformer, RNN** |

- **Transformer의 표준인 이유**
  - 문장마다 **길이가 다르고 패딩**이 있어 배치 통계가 의미 없다
  - 추론 때 한 문장씩 생성해도 동작이 같아야 한다
  - BERT·GPT·ViT 모두 각 블록에 LayerNorm (Residual과 함께: `x + Sublayer(LN(x))` — Pre-LN 방식이 학습 안정적)
- **학습 파라미터**: BN처럼 원소별 γ(weight), β(bias)가 있다 (`elementwise_affine=True`), running 통계는 없음
- 변형: **RMSNorm**(평균 빼기 없이 RMS로만 나눔 — LLaMA·Qwen 등 최신 LLM), GroupNorm(채널을 묶어 정규화, 작은 배치 CNN)

## 수식·원리
```
μ = mean(x[..., :]),  σ² = var(x[..., :])      (마지막 차원, 샘플·토큰별)
y = γ ⊙ (x − μ)/√(σ² + ε) + β
Transformer(Pre-LN):  x ← x + Attn(LN(x));  x ← x + FFN(LN(x))
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
x = torch.randn(2, 5, 8) * 3 + 7               # (배치, 토큰, d_model)
ln = nn.LayerNorm(8)
y = ln(x)
print(round(y[0, 0].mean().item(), 4), round(y[0, 0].std(unbiased=False).item(), 3))   # 0.0 1.0  ← 토큰마다
manual = (x - x.mean(-1, keepdim=True)) / torch.sqrt(x.var(-1, unbiased=False, keepdim=True) + 1e-5)
print(torch.allclose(y, manual, atol=1e-5))     # True
print(torch.allclose(ln(x[:1]), y[:1], atol=1e-6))   # True  배치 크기와 무관
print(len(list(ln.buffers())))                  # 0     running 통계 없음
```

## 관련 개념
[[Batch Normalization]] · [[Transformer Encoder]] · [[Residual Block]] · [[train()·eval() 모드]]
