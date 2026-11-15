---
title: Positional Encoding
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Transformer, 위치정보, AI응용]
---
# Positional Encoding

## 정의·핵심
- **정의 (응용 14차시)**: 각 단어 임베딩에 그 단어의 **위치를 나타내는 고유한 벡터를 더해** 순서 정보를 주입하는 방법
  - **최종 입력 = 단어 임베딩(의미 정보) + 위치 임베딩(순서 정보)** — 단어의 고유 의미와 문장 내 절대·상대 위치가 결합된 표현
- **Self-Attention의 치명적 약점: 순서를 모른다 (강의)**
  - **집합 연산(Permutation Invariant)**: 입력 순서가 바뀌어도 결과가 동일하게 계산 → {A, B, C}와 {C, B, A}를 구별 못 함 → [[Self-Attention]]
  - **의미 왜곡**: "I love you" = "you love I" → 주어·목적어가 바뀐 문장도 동일하게 인식
  - (RNN은 순차 처리 자체가 순서를 담지만, Transformer는 병렬 처리라 별도 주입 필요)
- **왜 Sin/Cos 함수인가 (강의)**
  - **주기성(Periodicity)**: 비슷한 거리의 단어들은 비슷한 패턴
  - **상대 위치(Relative Position)**: `PE(pos+k)`가 `PE(pos)`의 **선형 변환(회전)** 으로 표현 → 두 위치 간 거리를 쉽게 계산
  - **외삽(Extrapolation)**: 학습 때 못 본 긴 문장 길이도 함수로 계산 가능
  - 차원마다 **주파수가 다름** — 앞쪽 차원은 빠르게, 뒤쪽 차원은 느리게 진동 (강의 d_model=128 패턴 시각화: 값 −1~+1)
- **Learned PE vs Fixed PE (강의 표)**

| 구분 | Learned PE | Fixed (Sin/Cos) PE |
|---|---|---|
| 방식 | 파라미터로 학습 | 수학적 함수로 고정 |
| 외삽성 | 어려움 (길이 제한) | 가능 (함수 계산) |
| 성능 | 비슷함 | 비슷함 |
| 대표 모델 | **BERT, GPT** | **Original Transformer** |

- ViT도 패치 위치에 **학습형 Position Embedding** 사용 → [[Patch Embedding·CLS 토큰]]
- 최근 LLM: **RoPE**(회전 위치 인코딩), ALiBi — 상대 위치를 attention 안에 직접 반영

## 수식·원리
```
PE(pos, 2i)   = sin(pos / 10000^{2i/d_model})
PE(pos, 2i+1) = cos(pos / 10000^{2i/d_model})
입력 = Embedding(token) + PE(pos)
[sin(ω(p+k)), cos(ω(p+k))] = R(ωk) · [sin(ωp), cos(ωp)]   (회전 → 상대 위치)
```

## 코드 예시
```python
import math
import torch

def positional_encoding(max_len, d_model):
    pe = torch.zeros(max_len, d_model)
    pos = torch.arange(max_len).unsqueeze(1).float()
    div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
    pe[:, 0::2] = torch.sin(pos * div)
    pe[:, 1::2] = torch.cos(pos * div)
    return pe

pe = positional_encoding(50, 128)                        # 강의 시각화 크기 d_model=128
print(tuple(pe.shape), round(pe.min().item(), 2), round(pe.max().item(), 2))   # (50, 128) -1.0 1.0
print(pe[0, :4].tolist())                                # [0.0, 1.0, 0.0, 1.0]  위치 0
print(len({tuple(r.round(decimals=4).tolist()) for r in pe}))   # 50  위치마다 고유한 벡터

d = lambda a, b: (pe[a] - pe[b]).norm().item()
print(d(10, 11) < d(10, 30))                             # True  가까운 위치끼리 비슷한 패턴

emb = torch.randn(3, 128)                                # "I love you" 임베딩
x1 = emb + pe[:3]; x2 = emb[[2, 1, 0]] + pe[:3]          # "you love I"
print(torch.allclose(x1[[2, 1, 0]], x2))                 # False  위치 정보가 더해져 순서가 구별됨
```

## 관련 개념
[[Self-Attention]] · [[Transformer Encoder]] · [[임베딩]] · [[Patch Embedding·CLS 토큰]] · [[BERT]]
