---
title: Transformer Encoder
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Transformer, AI응용]
---
# Transformer Encoder

## 정의·핵심
- **정의 (응용 14차시 "Transformer Encoder 블록 구조")**: 입력 문장 전체를 **양방향으로** 보며 각 토큰의 **문맥 벡터(Contextual Vectors)** 를 만드는 블록. 이 블록을 **N번 반복**해 쌓음 (BERT-base 12층, BERT-large 24층)
- **데이터 흐름 (강의)**: 입력 Embedding + Positional Encoding → **① Multi-Head Self-Attention** → **Add & LayerNorm** → **② Feed-Forward Network** → **Add & LayerNorm** → (× N) → Encoder 출력
- **4가지 핵심 구성 요소 (강의)**
  1. **Multi-Head Self-Attention**: 모든 단어 간 관계 학습 → 문맥 파악 ('it'이 무엇을 가리키는지) — Context Modeling, Global Dependency → [[Multi-Head Attention]]
  2. **Residual Connection (Add)**: 입력을 출력에 더해 하위 층 정보를 상위 층으로 직접 전달 → **기울기 소실 해결**, gradient flow 개선 → [[Residual Block]]
  3. **Layer Normalization**: 각 층 출력을 (토큰별, 특징 방향으로) 정규화 → **학습 안정화, 수렴 속도 ↑**
  4. **Feed-Forward Network (FFN)**: 위치별로 독립적인 2층 MLP
- **FFN 상세 (강의 "Attention만으로는 부족하다!")**
  - `FFN(x) = GELU(xW₁ + b₁)W₂ + b₂`, Shape **768 → 3072 → 768 (4배 확장)**
  - **왜 4배 확장**: 저차원 정보를 고차원으로 투영해 더 풍부한 특징 학습, 비선형(ReLU/GELU)이 고차원에서 작동해 표현력 극대화
  - **Position-wise**: 각 단어(위치)마다 개별적으로, 동일하게 적용 → **단어 간 상호작용은 Attention에서 끝나고, FFN은 각 단어 의미를 심화** (병렬화 가능)
  - 파라미터 (BERT-base): W₁ 2,359,296 + W₂ 2,359,296 + b 3,840 = **약 4,722,432 (470만)**
- **설계 철학 (강의)**: Residual + LayerNorm이 깊은 네트워크 학습을 가능하게 함 — BERT 12~24층, GPT-3 96층
- **Post-LN vs Pre-LN**: 원 논문은 `LN(x + Sublayer(x))`(Post), 최근 모델(GPT-2 이후, ViT)은 `x + Sublayer(LN(x))`(Pre) — 깊어도 안정적
- Encoder만 쓰는 모델: **BERT**(이해, NLU), **ViT**(이미지 분류) → [[BERT]], [[ViT]]

## 수식·원리
```
z = LayerNorm(x + MultiHeadSelfAttn(x))
y = LayerNorm(z + FFN(z))
FFN(z) = GELU(z W₁ + b₁) W₂ + b₂,   W₁: 768×3072,  W₂: 3072×768
LayerNorm(x) = γ (x − μ) / √(σ² + ε) + β     (토큰별, d_model 방향)
```

## 코드 예시
```python
import torch
import torch.nn as nn

class EncoderBlock(nn.Module):
    def __init__(self, d=768, h=12, ff=3072):
        super().__init__()
        self.attn = nn.MultiheadAttention(d, h, batch_first=True)
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.ffn = nn.Sequential(nn.Linear(d, ff), nn.GELU(), nn.Linear(ff, d))
    def forward(self, x, pad_mask=None):
        a, _ = self.attn(x, x, x, key_padding_mask=pad_mask)
        x = self.ln1(x + a)                              # Add & Norm
        return self.ln2(x + self.ffn(x))                 # Add & Norm

torch.manual_seed(0)
blk = EncoderBlock()
x = torch.randn(2, 10, 768)
y = blk(x)
print(tuple(y.shape))                                    # (2, 10, 768)  입출력 크기 동일 → N번 쌓기 가능
print(sum(p.numel() for p in blk.ffn.parameters()))      # 4722432  강의 FFN 파라미터 수
print(round(y[0, 0].mean().item(), 3), round(y[0, 0].std(unbiased=False).item(), 2))   # 0.0 1.0  LayerNorm

z = blk.ln1(x)                                           # Position-wise: 토큰 하나만 바꿔도 다른 토큰 FFN 결과는 그대로
z2 = z.clone(); z2[0, 3] += 1
print(torch.allclose(blk.ffn(z)[0, 5], blk.ffn(z2)[0, 5]))   # True

enc = nn.TransformerEncoder(nn.TransformerEncoderLayer(768, 12, 3072, batch_first=True), num_layers=2)
print(tuple(enc(x).shape))                               # (2, 10, 768)
```

## 관련 개념
[[Multi-Head Attention]] · [[Positional Encoding]] · [[Transformer Decoder]] · [[BERT]] · [[ViT]] · [[Residual Block]]
