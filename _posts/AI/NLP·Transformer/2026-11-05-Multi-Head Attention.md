---
title: Multi-Head Attention
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Attention, Transformer, AI응용]
---
# Multi-Head Attention

## 정의·핵심
- **정의 (응용 14차시)**: 입력 Q, K, V를 여러 개의 **head로 분할**하고, 각 head마다 **독립적으로 attention**을 계산한 뒤 결과를 **결합(Concat)** 하는 방식 → 모델이 여러 표현 공간에서 동시에 정보에 집중
- **처리 흐름 (강의)**: 입력(Embedding) → Head 1(문법), Head 2(의미), …, Head 12 → **Concat(통합)** → **Linear(W_O, 최종 출력)**
- **왜 필요한가 (강의)**
  - **단일 Attention의 한계**: 한 문장 안에 문법적·의미적·위치적 관계가 혼재 → 하나의 head로 모두 학습하기 어려움
    - 예: "The teacher taught the student in the classroom" — teacher ← taught(주어), taught → student(목적어), student → classroom(장소)
  - **해결(Multi-View)**: 입력을 여러 **하위 공간(Subspace)** 으로 나눠 head마다 다른 관점(문법 구조, 의미 유사도, 위치 정보, 화자 의도)을 독립 학습
  - **12대 카메라 비유**: 단일 head = 카메라 1대, Multi-Head = 12대가 다양한 각도에서 동시에 촬영 → 더 입체적인 정보
- **BERT-base 예시 (강의)**: d_model **768**, head 수 h **12**, head별 차원 d_k = 768/12 = **64**, 총 파라미터 약 110M
  - Linear Projection(Q, K, V): 3 × (768 → 768) → head별 64차원으로 쪼갬 → Concat 12 × 64 = 768 → W_O(768 → 768)
- **핵심 포인트 (강의)**
  - **독립적 학습**: head마다 다른 W_Q, W_K, W_V
  - **병렬 처리**: 12개 attention이 동시에 계산
  - **차원 유지**: 분할 후 다시 Concat → 입력·출력 차원 동일 (연산량은 단일 head 768차원과 비슷)
- **head 수 실험 (강의, WMT 2014 Base)**: h=1 BLEU 24.5 → 4: 26.1 → 8: 27.3 → 12: **27.8** → 16: 27.9 (**수익 체감**)
- head별 학습 패턴 경향 (강의): 1~4 문법(Syntactic), 5~8 의미(Semantic), 9~12 위치(Positional)

## 수식·원리
```
head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V),   W_i ∈ ℝ^{d_model × d_k},  d_k = d_model / h
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W^O
BERT-base: 768 = 12 × 64
파라미터: 4 · d_model² (+ bias)   (W_Q, W_K, W_V, W_O)
```

## 코드 예시
```python
import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=768, h=12):
        super().__init__()
        self.h, self.dk = h, d_model // h
        self.qkv = nn.Linear(d_model, 3 * d_model)               # 3 × (768 → 768)
        self.o = nn.Linear(d_model, d_model)                     # W_O
    def forward(self, x):
        B, n, D = x.shape
        q, k, v = self.qkv(x).view(B, n, 3, self.h, self.dk).permute(2, 0, 3, 1, 4)   # (B, h, n, dk)
        w = (q @ k.transpose(-2, -1) / self.dk ** 0.5).softmax(-1)
        out = (w @ v).transpose(1, 2).reshape(B, n, D)           # Concat
        return self.o(out), w

torch.manual_seed(0)
mha = MultiHeadAttention()
x = torch.randn(2, 10, 768)
out, w = mha(x)
print(tuple(out.shape), tuple(w.shape), mha.dk)                  # (2, 10, 768) (2, 12, 10, 10) 64  차원 유지, head 12개
print(sum(p.numel() for p in mha.parameters()))                  # 2362368 = 4·768² + 4·768

ref = nn.MultiheadAttention(768, 12, batch_first=True)           # PyTorch 내장
print(tuple(ref(x, x, x)[0].shape))                              # (2, 10, 768)
```

## 관련 개념
[[Scaled Dot-Product Attention]] · [[Self-Attention]] · [[Transformer Encoder]] · [[BERT]] · [[ViT]]
