---
title: Attention 개념
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, Attention, Transformer, AI응용]
---
# Attention 개념

## 정의·핵심
- **정의**: 출력을 만들 때 입력 시퀀스 **전체를 다시 보되, 지금 필요한 부분에 더 큰 가중치**를 두어 정보를 가져오는 메커니즘 (Bahdanau et al., 2015 — Seq2Seq 번역에서 출발)
- **왜 필요했나 — RNN/LSTM의 3가지 한계 (응용 14차시)**
  1. **순차 처리 → 병렬화 불가**: 이전 단계 계산이 끝나야 다음 단계 시작 → GPU 병렬 처리 능력을 활용 못 해 학습이 느림
  2. **장거리 의존성**: 문장이 길수록 앞부분 정보 소실, Gradient Vanishing으로 문맥 유지가 어려움
  3. **정보 병목**: 모든 정보를 **고정 크기 hidden state 벡터 하나**에 압축 → 정보 손실 (Seq2Seq 인코더의 마지막 벡터 문제)
- **Attention의 해결**
  - 디코더가 매 시점 **인코더의 모든 hidden state**를 보고, 현재 상태와의 **유사도(score)** → softmax → **가중치 α** → 가중합 = **context vector**
  - 압축하지 않고 필요한 정보만 **선택적으로** 가져옴 (강의: "무한한 메모리 접근")
  - 이미지 캡셔닝에서는 단어마다 이미지 영역에 집중 → [[캡셔닝 Attention]]
- **Transformer로의 확장 (강의 "Transformer의 혁신")**
  1. **완벽한 병렬화**: 모든 위치를 동시에 계산 → 학습 속도 10배 이상
  2. **직접 연결**: **Self-Attention**으로 모든 위치가 서로 직접 참조 → 거리와 무관하게 정보 전달 → [[Self-Attention]]
  3. **무한한 메모리 접근**: 압축 없이 필요한 정보만 선택
  - "Attention Is All You Need"(Vaswani et al., 2017): RNN 없이 Attention만으로 구성
- **Score 함수 종류**: 내적(dot) `q·k`, **scaled dot** `q·k/√d` (Transformer) → [[Scaled Dot-Product Attention]], additive(Bahdanau) `wᵀtanh(W₁q + W₂k)`
- **해석 가능성**: 가중치 α를 시각화(Attention Map)해 모델이 어디를 봤는지 확인 → [[ViT Attention Map]]

## 수식·원리
```
score_i = score(s_t, h_i)          (s_t: 디코더 상태, h_i: 인코더 i번째 상태)
α_i = softmax(score)_i,   Σ α_i = 1
c_t = Σ_i α_i h_i                  context vector
ŷ_t = f(s_t, c_t)
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
enc_h = torch.randn(6, 8)                    # 인코더 hidden 6개 (단어 6개)
enc_h[3] = torch.ones(8) * 2                 # 3번 단어가 지금 필요한 정보라고 가정
s_t = torch.ones(8)                          # 디코더 현재 상태 (질문)

score = enc_h @ s_t                          # 내적 유사도
alpha = score.softmax(0)
context = alpha @ enc_h                      # 가중합
print(alpha.argmax().item(), round(alpha.max().item(), 3))   # 3 1.0  필요한 위치에 집중
print(round(alpha.sum().item(), 3), tuple(context.shape))    # 1.0 (8,)

bottleneck = enc_h[-1]                       # Seq2Seq: 마지막 상태 하나만 사용
print(torch.allclose(bottleneck, enc_h[3]), torch.allclose(context, enc_h[3], atol=1e-3))   # False True  병목 vs 직접 참조
```

## 관련 개념
[[Self-Attention]] · [[Scaled Dot-Product Attention]] · [[Multi-Head Attention]] · [[캡셔닝 Attention]] · [[Transformer vs RNN·LSTM]] · [[RNN]]
