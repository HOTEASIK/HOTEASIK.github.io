---
title: Scaled Dot-Product Attention
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Attention, Transformer, 수식, AI응용]
---
# Scaled Dot-Product Attention

## 정의·핵심
- **정의**: Transformer의 기본 Attention 연산 — **Q와 K의 내적을 √d_k로 나눈 뒤 softmax**를 취해 V를 가중합 (응용 14차시 "Scaled Dot product Attention 수식")
- **기호 (강의 표)**

| 기호 | 의미 | 차원 | 역할 |
|---|---|---|---|
| Q | Query (질문) | n × d_k | 현재 위치에서 찾고자 하는 정보의 기준 벡터 |
| K | Key (색인) | n × d_k | 각 위치가 가진 정보를 식별하는 색인 벡터 |
| V | Value (값) | n × d_v | 실제 전달할 내용 |
| QKᵀ | Attention Score | n × n | 모든 토큰 쌍 간 유사도(내적) |
| softmax | 확률 변환 | n × n | 점수를 확률 분포(합 = 1)로 정규화 |

- **왜 Scaling(√d_k)이 필요한가 (강의)**
  - **문제**: 차원 d_k가 커질수록 내적 QKᵀ 값이 매우 커짐 (q, k 원소가 평균 0·분산 1이면 내적의 분산 = d_k)
  - **결과**: softmax가 극단적인 값(0 또는 1)을 출력 → 역전파 시 **기울기 소실(Gradient Vanishing)**
  - √d_k로 나누면 분산이 1로 돌아와 softmax가 적당히 부드러움
- **시간 복잡도 (강의)**: **O(n²·d)** — n = 시퀀스 길이. 모든 위치 간 관계를 동시에 계산하므로 제곱이지만, **완벽한 병렬 처리**로 GPU에서 매우 빠름
  - 긴 시퀀스에선 메모리 부담 → FlashAttention, Sparse/Linear Attention 등으로 개선
- **마스크**: softmax 전에 막을 위치에 **−∞** 더함 → 가중치 0
  - **Padding mask**: 패딩 토큰 무시
  - **Causal(look-ahead) mask**: 디코더에서 미래 토큰 차단 → [[Transformer Decoder]]
- PyTorch 2.x: `F.scaled_dot_product_attention(q, k, v, attn_mask, is_causal)` 내장

## 수식·원리
```
Attention(Q, K, V) = softmax( Q Kᵀ / √d_k ) V
q, k ~ 원소 평균 0, 분산 1  →  Var(q·k) = d_k  →  Var(q·k / √d_k) = 1
마스크:  softmax(QKᵀ/√d_k + M),  M_ij = 0 (허용) 또는 −∞ (차단)
```

## 코드 예시
```python
import torch
import torch.nn.functional as F

def attention(Q, K, V, mask=None):
    scores = Q @ K.transpose(-2, -1) / Q.size(-1) ** 0.5
    if mask is not None: scores = scores.masked_fill(mask == 0, float("-inf"))
    w = scores.softmax(-1)
    return w @ V, w

torch.manual_seed(0)
for d in (4, 64, 1024):                                    # 차원이 커질수록 내적이 커짐
    q, k = torch.randn(10000, d), torch.randn(10000, d)
    dot = (q * k).sum(1)
    print(d, round(dot.var().item() / d, 1), round((dot / d ** 0.5).var().item(), 1))   # 4 1.0 1.0 ...  내적 분산 = d → 스케일 후 1

s = torch.randn(1, 8) * 32                                 # 스케일 안 한 큰 점수
print(round(s.softmax(-1).max().item(), 3), round((s / 32).softmax(-1).max().item(), 3))   # 0.998 0.229  스케일 안 하면 한 곳에 몰림(포화)

Q = K = V = torch.randn(1, 4, 8)
mask = torch.tensor([[1, 1, 1, 0]])                        # 4번째 = 패딩
out, w = attention(Q, K, V, mask)
print(w[0, :, 3].tolist())                                 # [0.0, 0.0, 0.0, 0.0]  패딩에 가중치 0
print(torch.allclose(out, F.scaled_dot_product_attention(Q, K, V, attn_mask=mask.bool()), atol=1e-6))   # True  내장 함수와 같음
```

## 관련 개념
[[Self-Attention]] · [[Multi-Head Attention]] · [[Transformer Decoder]] · [[Attention 개념]] · [[Softmax]]
