---
title: Transformer Decoder
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Transformer, 생성, AI응용]
---
# Transformer Decoder

## 정의·핵심
- **정의 (응용 14차시 "Transformer Decoder 블록")**: **미래 정보를 차단하는 Masked Self-Attention**과 인코더를 참조하는 **Cross-Attention**으로 출력 시퀀스를 **한 토큰씩 순차 생성**하는 블록
- **Encoder vs Decoder (강의 표)**

| 구분 | Encoder | Decoder |
|---|---|---|
| Self-Attention | 양방향 (전체 참조) | **Masked** (과거만 참조) |
| Cross-Attention | 없음 | 있음 (Encoder 참조) |
| 역할 | 입력 이해 (Understanding) | 출력 생성 (Generation) |

- **블록 구성**: Masked Multi-Head Self-Attention → Add & Norm → **Cross-Attention** → Add & Norm → FFN → Add & Norm
- **Masked Attention (강의 "I love you" 예)**: 각 위치는 **자기 자신과 이전 위치만** 볼 수 있고, 미래 위치에는 **−∞** (softmax 후 0)
  - 마스크 = 하삼각 행렬: I → [1, −∞, −∞, −∞], love → [1, 1, −∞, −∞], you → [1, 1, 1, −∞], `<E>` → [1, 1, 1, 1]
  - **Why Masking**: 학습 시 정답(미래 단어)을 미리 보고 예측하는 **'커닝(Cheating)' 방지** — 학습은 정답 시퀀스 전체를 한 번에 넣어 병렬로 하되(Teacher Forcing), 각 위치는 과거만 보게 함 → [[Teacher Forcing]]
- **Cross-Attention (강의)**: 생성할 때 Encoder 정보를 참고
  - **Query = Decoder의 현재 상태**, **Key·Value = Encoder의 최종 출력**
- **Auto-regressive 생성 (강의)**: `<Start>` → I → `<S> I` → love → `I love` → you → `love you` → `<End>` — 이전 단계 출력이 다음 입력으로
  - GPT 슬라이드 번역 예: "I am a student" → 인코더 / 디코더 `<sos>` → je → suis → étudiant → `<eos>`
- **Decoder-only 모델**: Cross-Attention 없이 Masked Self-Attention만 → **GPT**, 현재 LLM 대부분 → [[GPT]]

## 수식·원리
```
M_ij = 0 (j ≤ i),  −∞ (j > i)
MaskedAttn = softmax(Q Kᵀ / √d_k + M) V
CrossAttn  = softmax(Q_dec K_encᵀ / √d_k) V_enc
p(y_t | y_{<t}, x) = softmax(W · h_t)
```

## 코드 예시
```python
import torch
import torch.nn as nn

n = 4                                                         # "I love you <E>"
mask = torch.triu(torch.full((n, n), float("-inf")), diagonal=1)
print(mask.tolist()[1])                                       # [0.0, 0.0, -inf, -inf]  love는 I, love만 봄

torch.manual_seed(0)
scores = torch.randn(n, n)
w = (scores + mask).softmax(-1)
print(torch.equal(w.triu(1), torch.zeros(n, n)))              # True  미래 가중치 = 0

layer = nn.TransformerDecoderLayer(d_model=32, nhead=4, dim_feedforward=64, batch_first=True)
dec = nn.TransformerDecoder(layer, num_layers=2).eval()
memory = torch.randn(1, 5, 32)                                # Encoder 출력 (Cross-Attention의 K, V)
tgt = torch.randn(1, n, 32)
causal = nn.Transformer.generate_square_subsequent_mask(n)
out = dec(tgt, memory, tgt_mask=causal)
print(tuple(out.shape))                                       # (1, 4, 32)

tgt2 = tgt.clone(); tgt2[0, 3] += 5                           # 마지막(미래) 토큰을 바꿔도
out2 = dec(tgt2, memory, tgt_mask=causal)
print(torch.allclose(out[0, :3], out2[0, :3], atol=1e-5))     # True  앞 위치 출력은 그대로 → 커닝 불가
```

## 관련 개념
[[Transformer Encoder]] · [[Scaled Dot-Product Attention]] · [[GPT]] · [[Teacher Forcing]] · [[Autoregressive 모델(언급)]] · [[T5]]
