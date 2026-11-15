---
title: Self-Attention
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Attention, Transformer, AI응용]
---
# Self-Attention

## 정의·핵심
- **정의**: 한 시퀀스 안에서 **각 토큰이 같은 시퀀스의 모든 토큰(자기 자신 포함)을 참조**해 문맥이 반영된 새 표현을 만드는 Attention. Q, K, V가 **모두 같은 입력 X**에서 나옴 (응용 14차시 "Self-Attention의 핵심: Query, Key, Value")
- **데이터베이스 검색 비유 (강의)**
  - **Query (Q) — 질문**: "내가 지금 찾고자 하는 정보는?" 현재 토큰이 다른 위치의 정보를 찾기 위해 던지는 질문 벡터 (검색창의 검색어 "스마트폰")
  - **Key (K) — 색인**: "나는 어떤 정보를 가지고 있는가?" 각 위치가 자신을 식별하도록 제공하는 색인 벡터 (웹페이지 제목·태그 "아이폰 15 리뷰")
  - **Value (V) — 실제 내용**: Query와 Key가 일치할 때 최종적으로 가져올 실제 정보 (클릭한 웹페이지 본문)
- **문장 예시 (강의)**: "The animal didn't cross the street because **it** was too tired"
  - Query(it): "나는 누구를 가리키는 대명사인가?" / Key(모든 단어): 각 단어가 자신의 특성 노출
  - it의 Query와 **animal**의 Key가 가장 높은 Attention Score → animal의 Value를 it에 반영 → 기계가 "it = animal" 학습 (대명사 해결, Coreference Resolution — 'tired' 문맥으로 street가 아님을 파악, 가중치 0.9)
- **계산 5단계 (강의)**
  1. **Q, K, V 생성**: `X·W_Q, X·W_K, X·W_V` (학습 가능한 가중치 행렬로 선형 투사)
  2. **Score**: `Q·Kᵀ` — 두 단어 간 연관성
  3. **Scaling**: `÷ √d_k` — 기울기 안정화
  4. **Softmax**: 0~1 확률(합 1)
  5. **Value 가중합**: `Σ(weights × V)`
  - 강의 숫자 예: Q = [1,0,2,1], K = [1,1,0,1] → 내적 2 → ÷√4 = **1.0** → softmax 후 (나 0.7, 너 0.2, 그 0.1) → `0.7·V₁ + 0.2·V₂ + 0.1·V₃`
- **순서 무관성**: 입력 순서를 섞으면 출력도 똑같이 섞일 뿐 (Permutation Equivariant) → 순서 정보는 **Positional Encoding**으로 주입 → [[Positional Encoding]]
- **복잡도**: 모든 쌍을 계산 → **O(n²·d)**, 대신 완전 병렬

## 수식·원리
```
Q = X W_Q,  K = X W_K,  V = X W_V          (X: n × d_model)
Attention(Q, K, V) = softmax(Q Kᵀ / √d_k) V
출력 i = Σ_j softmax_j(q_i·k_j / √d_k) · v_j
```

## 코드 예시
```python
import torch
import torch.nn as nn

q, k = torch.tensor([1., 0, 2, 1]), torch.tensor([1., 1, 0, 1])   # 강의 숫자 예시
print((q @ k).item(), (q @ k / 4 ** 0.5).item())                  # 2.0 1.0

class SelfAttention(nn.Module):
    def __init__(self, d_model, d_k):
        super().__init__()
        self.Wq, self.Wk, self.Wv = (nn.Linear(d_model, d_k, bias=False) for _ in range(3))
    def forward(self, X):
        Q, K, V = self.Wq(X), self.Wk(X), self.Wv(X)               # ① 같은 X에서 Q, K, V
        w = (Q @ K.transpose(-2, -1) / K.size(-1) ** 0.5).softmax(-1)   # ②③④
        return w @ V, w                                            # ⑤

torch.manual_seed(0)
sa = SelfAttention(16, 8)
X = torch.randn(1, 5, 16)                                          # 토큰 5개
out, w = sa(X)
print(tuple(out.shape), tuple(w.shape))                            # (1, 5, 8) (1, 5, 5)  모든 쌍의 가중치
print(torch.allclose(w.sum(-1), torch.ones(1, 5)))                 # True

perm = torch.tensor([4, 2, 0, 1, 3])                               # 순서를 섞으면
out_p, _ = sa(X[:, perm])
print(torch.allclose(out_p, out[:, perm], atol=1e-6))              # True  결과도 똑같이 섞일 뿐 → 순서를 모름
```

## 관련 개념
[[Scaled Dot-Product Attention]] · [[Multi-Head Attention]] · [[Attention 개념]] · [[Positional Encoding]] · [[Transformer Encoder]] · [[ViT Attention Map]]
