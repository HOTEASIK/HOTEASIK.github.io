---
title: Transformer vs RNN·LSTM
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Transformer, RNN, 비교, AI응용]
---
# Transformer vs RNN·LSTM

## 정의·핵심
- **비교 (응용 14차시 "순차적 처리의 한계를 넘어 병렬 연산의 시대로")**

| 특징 | RNN / LSTM | Transformer |
|---|---|---|
| 병렬 처리 | 불가능 (순차 계산) | **완벽함** (동시 계산) |
| 장기 의존성 | 어려움 (Gradient 소실) | **쉬움** (모든 위치 직접 연결) |
| 학습 속도 | 느림 | **매우 빠름** (GPU 최적화) |
| 계산 복잡도 | **O(n)** (선형적, 가벼움) | O(n²) (길이에 제곱 비례) |
| 해석 가능성 | 어려움 (black box) | **쉬움** (Attention map) |
| 문맥 길이 | 짧음 (정보 손실) | **긺** (모든 토큰 참조) |

- **결론 (강의)**: 병렬 처리 덕분에 Transformer가 **압도적으로 빠르고**, 장거리 문맥 파악으로 **번역 품질(BLEU) 향상**
- **경로 길이 관점**: 두 토큰 사이 정보가 거치는 단계 — RNN은 **O(n)** 스텝(멀수록 희미), Self-Attention은 **O(1)** (한 번에 직접)
- **복잡도 트레이드오프**: 층당 연산은 RNN `O(n·d²)` vs Self-Attention `O(n²·d)` → n < d 인 일반 문장에선 Transformer가 유리, 아주 긴 시퀀스(n ≫ d)에선 메모리 부담
- **RNN이 여전히 쓰이는 곳**: 데이터·자원이 적을 때, **스트리밍/실시간**(한 스텝씩 상태 유지, 추론 메모리 일정), 임베디드. 최근 **Mamba·RWKV** 등 선형 복잡도 순환형 모델이 재조명
- **개론 17차시 모델 비교**: 직접 학습한 LSTM vs 사전학습 DistilBERT 파인튜닝 → 사전학습 Transformer가 적은 epoch로 더 높은 정확도 → [[텍스트 분류 실습]]
- 비전에서의 같은 구도: **CNN vs ViT** → [[Inductive Bias]]

## 수식·원리
```
RNN:          h_t = f(h_{t−1}, x_t)      → t가 h_{t−1}에 의존 → 순차
Transformer:  H = Attn(X W_Q, X W_K, X W_V)  → 행렬곱 한 번에 모든 위치
최대 경로 길이: RNN O(n),  Self-Attention O(1)
층당 연산: RNN O(n·d²),  Self-Attention O(n²·d)
```

## 코드 예시
```python
import time
import torch
import torch.nn as nn

torch.manual_seed(0)
B, n, d = 16, 256, 128
x = torch.randn(B, n, d)
lstm = nn.LSTM(d, d, batch_first=True)
enc = nn.TransformerEncoderLayer(d, 4, 4 * d, batch_first=True)

with torch.no_grad():                            # 1) 장거리 의존: 첫 토큰을 바꿨을 때 마지막 출력 변화
    x2 = x.clone(); x2[:, 0] += 3
    d_lstm = (lstm(x2)[0][:, -1] - lstm(x)[0][:, -1]).abs().mean().item()
    d_tf = (enc(x2)[:, -1] - enc(x)[:, -1]).abs().mean().item()
print(d_tf > d_lstm)                             # True  Transformer는 먼 토큰 영향이 직접 전달

attn_n = lambda n: n * n                         # 2) 복잡도: 길이 2배 → attention 행렬 4배
print(attn_n(512) // attn_n(256))                # 4

def timeit(f, k=3):
    t = time.perf_counter()
    for _ in range(k): f()
    return (time.perf_counter() - t) / k
with torch.no_grad():                            # 3) 순차 루프 vs 병렬 (CPU 기준, 결과는 환경마다 다름)
    cell = nn.LSTMCell(d, d)
    def seq():
        h = c = torch.zeros(B, d)
        for t in range(n): h, c = cell(x[:, t], (h, c))
    print(timeit(seq) > 0, timeit(lambda: enc(x)) > 0)   # True True
```

## 관련 개념
[[RNN]] · [[LSTM]] · [[Attention 개념]] · [[Self-Attention]] · [[Transformer Encoder]] · [[Inductive Bias]]
